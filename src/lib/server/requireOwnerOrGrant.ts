import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";

type Scope = "read" | "write" | "upload";

type GrantCheckResult =
  | { ok: true; actor_org_id: string | null; mode: "owner" | "grant_user" | "grant_org" }
  | { ok: false; reason: string };

async function resolveProfessionalRefs(userId: string) {
  const admin = supabaseAdmin();
  const refs = new Set<string>();
  refs.add(userId);

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (profileResult.data?.org_id) {
    refs.add(profileResult.data.org_id);
  }

  const professionalResult = await admin
    .from("professionals")
    .select("id, owner_id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (professionalResult.error) {
    throw professionalResult.error;
  }

  if (professionalResult.data?.id) {
    refs.add(professionalResult.data.id);
  }

  return Array.from(refs).filter(Boolean);
}

function hasRequiredScope(grant: any, scope: Scope) {
  if (scope === "read") {
    return grant.scope_read === true || grant.scope_write === true || grant.scope_upload === true;
  }

  if (scope === "write") {
    return grant.scope_write === true;
  }

  // upload: compatibilità retroattiva
  // se un grant storico ha write=true ma upload=false/null,
  // consideriamo comunque valido l'upload
  return grant.scope_upload === true || grant.scope_write === true;
}

export async function requireOwnerOrGrant(
  supabase: SupabaseClient,
  userId: string,
  animalId: string,
  scope: Scope
): Promise<GrantCheckResult> {
  const admin = supabaseAdmin();

  const { data: animal, error: aErr } = await admin
    .from("animals")
    .select("id, owner_id")
    .eq("id", animalId)
    .single();

  if (aErr || !animal) {
    return { ok: false, reason: "Animale non trovato." };
  }

  if ((animal as any).owner_id === userId) {
    return { ok: true, actor_org_id: null, mode: "owner" };
  }

  const { data: grants, error: gErr } = await admin
    .from("animal_access_grants")
    .select(
      "id, grantee_type, grantee_id, scope_read, scope_write, scope_upload, valid_from, valid_to, status, revoked_at"
    )
    .eq("animal_id", animalId)
    .in("status", ["active", "approved"])
    .is("revoked_at", null);

  if (gErr) {
    return { ok: false, reason: "Errore permessi (grants)." };
  }

  const now = Date.now();

  const isTimeOk = (g: any) => {
    const from = g.valid_from ? new Date(g.valid_from).getTime() : 0;
    const to = g.valid_to ? new Date(g.valid_to).getTime() : Infinity;
    return now >= from && now <= to;
  };

  const userGrant = (grants || []).find(
    (g: any) =>
      g.grantee_type === "user" &&
      g.grantee_id === userId &&
      isTimeOk(g) &&
      hasRequiredScope(g, scope)
  );

  if (userGrant) {
    return { ok: true, actor_org_id: null, mode: "grant_user" };
  }

  const refs = await resolveProfessionalRefs(userId);

  const orgGrant = (grants || []).find(
    (g: any) =>
      g.grantee_type === "org" &&
      refs.includes(String(g.grantee_id)) &&
      isTimeOk(g) &&
      hasRequiredScope(g, scope)
  );

  if (orgGrant) {
    return {
      ok: true,
      actor_org_id: String(orgGrant.grantee_id),
      mode: "grant_org",
    };
  }

  return {
    ok: false,
    reason: "Accesso negato: nessun consenso attivo (grant) per questo animale.",
  };
}