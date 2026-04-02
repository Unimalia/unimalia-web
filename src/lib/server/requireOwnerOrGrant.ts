import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

type Scope = "read" | "write" | "upload";

type GrantCheckResult =
  | {
      ok: true;
      actor_organization_id: string | null;
      mode: "owner" | "grant_user" | "grant_org";
    }
  | {
      ok: false;
      reason: string;
    };

type AnimalOwnerRow = {
  id: string;
  owner_id: string | null;
};

type AnimalGrantRow = {
  id: string;
  grantee_type: string;
  grantee_id: string;
  scope_read: boolean | null;
  scope_write: boolean | null;
  scope_upload: boolean | null;
  valid_from: string | null;
  valid_to: string | null;
  status: string | null;
  revoked_at: string | null;
};

function hasRequiredScope(grant: AnimalGrantRow, scope: Scope) {
  if (scope === "read") {
    return grant.scope_read === true || grant.scope_write === true;
  }

  if (scope === "write") {
    return grant.scope_write === true;
  }

  return grant.scope_upload === true || grant.scope_write === true;
}

function isGrantActiveNow(grant: AnimalGrantRow) {
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

  const { data: animal, error: animalError } = await admin
    .from("animals")
    .select("id, owner_id")
    .eq("id", animalId)
    .single<AnimalOwnerRow>();

  if (animalError || !animal) {
    return { ok: false, reason: "Animale non trovato." };
  }

  if (animal.owner_id === userId) {
    return { ok: true, actor_organization_id: null, mode: "owner" };
  }

  const { data: grants, error: grantsError } = await admin
    .from("animal_access_grants")
    .select(
      "id, grantee_type, grantee_id, scope_read, scope_write, scope_upload, valid_from, valid_to, status, revoked_at"
    )
    .eq("animal_id", animalId)
    .returns<AnimalGrantRow[]>();

  if (grantsError) {
    return { ok: false, reason: "Errore permessi (grants)." };
  }

  const activeGrants = (grants || []).filter((grant) => isGrantActiveNow(grant));

  const userGrant = activeGrants.find(
    (grant) =>
      grant.grantee_type === "user" &&
      String(grant.grantee_id) === String(userId) &&
      hasRequiredScope(grant, scope)
  );

  if (userGrant) {
    return { ok: true, actor_organization_id: null, mode: "grant_user" };
  }

  const organizationId = await getProfessionalOrgId();

  const organizationGrant = activeGrants.find(
    (grant) =>
      grant.grantee_type === "organization" &&
      organizationId &&
      String(grant.grantee_id) === String(organizationId) &&
      hasRequiredScope(grant, scope)
  );

  if (organizationGrant) {
    return {
      ok: true,
      actor_organization_id: String(organizationGrant.grantee_id),
      mode: "grant_org",
    };
  }

  return {
    ok: false,
    reason: "Accesso negato: nessun grant attivo per questo animale.",
  };
}