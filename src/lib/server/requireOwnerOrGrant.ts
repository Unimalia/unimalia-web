import { SupabaseClient } from "@supabase/supabase-js";

type Scope = "read" | "write" | "upload";

type GrantCheckResult =
  | { ok: true; actor_org_id: string | null; mode: "owner" | "grant_user" | "grant_org" }
  | { ok: false; reason: string };

export async function requireOwnerOrGrant(
  supabase: SupabaseClient,
  userId: string,
  animalId: string,
  scope: Scope
): Promise<GrantCheckResult> {
  // 1) owner: animals.owner_id
  const { data: animal, error: aErr } = await supabase
    .from("animals")
    .select("id, owner_id")
    .eq("id", animalId)
    .single();

  if (aErr || !animal) return { ok: false, reason: "Animale non trovato." };

  if ((animal as any).owner_id === userId) {
    return { ok: true, actor_org_id: null, mode: "owner" };
  }

  // 2) grant user/org
  const scopeCol = scope === "read" ? "scope_read" : scope === "write" ? "scope_write" : "scope_upload";

  const { data: grants, error: gErr } = await supabase
    .from("animal_access_grants")
    .select("id, grantee_type, grantee_id, scope_read, scope_write, scope_upload, valid_from, valid_to, status")
    .eq("animal_id", animalId)
    .eq("status", "active");

  if (gErr) return { ok: false, reason: "Errore permessi (grants)." };

  const now = Date.now();

  // helper: grant valido nel tempo
  const isTimeOk = (g: any) => {
    const from = g.valid_from ? new Date(g.valid_from).getTime() : 0;
    const to = g.valid_to ? new Date(g.valid_to).getTime() : Infinity;
    return now >= from && now <= to;
  };

  // 2a) grant diretto all'utente
  const userGrant = (grants || []).find(
    (g: any) => g.grantee_type === "user" && g.grantee_id === userId && isTimeOk(g) && g[scopeCol] === true
  );
  if (userGrant) return { ok: true, actor_org_id: null, mode: "grant_user" };

  // 2b) grant a una org dove l'utente è membro
  const orgGrants = (grants || []).filter(
    (g: any) => g.grantee_type === "org" && isTimeOk(g) && g[scopeCol] === true
  );

  if (orgGrants.length > 0) {
    const orgIds = orgGrants.map((g: any) => g.grantee_id);

    const { data: memberships, error: mErr } = await supabase
      .from("organization_members")
      .select("org_id, user_id, role")
      .eq("user_id", userId)
      .in("org_id", orgIds);

    if (!mErr && memberships && memberships.length > 0) {
      // primo match
      return { ok: true, actor_org_id: (memberships[0] as any).org_id, mode: "grant_org" };
    }
  }

  return { ok: false, reason: "Accesso negato: nessun consenso attivo (grant) per questo animale." };
}