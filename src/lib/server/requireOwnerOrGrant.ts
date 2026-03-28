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

  return grant.scope_upload === true || grant.scope_write === true;
}

function isGrantActiveNow(grant: any) {
  if (!grant) return false;
  if (grant.revoked_at) return false;
  if (grant.status !== "active") return false;

  const now = Date.now();
  const from = grant.valid_from ? new Date(grant.valid_from).getTime() : 0;
  const to = grant.valid_to ? new Date(grant.valid_to).getTime() : Infinity;

  if (Number.isFinite(from) && now < from) return false;
  if (Number.isFinite(to) && now > to) return false;

  return true;
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
    .eq("animal_id", animalId);

  if (gErr) {
    return { ok: false, reason: "Errore permessi (grants)." };
  }

  const activeGrants = (grants || []).filter((g: any) => isGrantActiveNow(g));

  const userGrant = activeGrants.find(
    (g: any) =>
      g.grantee_type === "user" &&
      String(g.grantee_id) === String(userId) &&
      hasRequiredScope(g, scope)
  );

  if (userGrant) {
    return { ok: true, actor_org_id: null, mode: "grant_user" };
  }

  const refs = await resolveProfessionalRefs(userId);

  const orgGrant = activeGrants.find(
    (g: any) =>
      g.grantee_type === "organization" &&
      refs.includes(String(g.grantee_id)) &&
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
    reason: "Accesso negato: nessun grant attivo per questo animale.",
  };
}