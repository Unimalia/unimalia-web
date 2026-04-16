import "server-only";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

async function getAuthenticatedUserId() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return user.id;
}

type AnimalAccessGrantRow = {
  id: string;
  grantee_type: string | null;
  grantee_id: string | null;
  status: string | null;
  valid_from: string | null;
  valid_to: string | null;
  revoked_at: string | null;
  scope_read: boolean | null;
  scope_write: boolean | null;
  scope_upload: boolean | null;
};

export async function hasActiveGrantForAnimal(animalId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return false;

  const admin = supabaseAdmin();
  const organizationId = await getProfessionalOrgId(userId);

  const { data: animal, error: animalError } = await admin
    .from("animals")
    .select("id, owner_id")
    .eq("id", animalId)
    .maybeSingle();

  if (animalError) {
    throw animalError;
  }

  if (!animal) {
    return false;
  }

  if (animal.owner_id === userId) {
    return true;
  }

  const { data: grants, error: grantsError } = await admin
    .from("animal_access_grants")
    .select(
      "id, grantee_type, grantee_id, status, valid_from, valid_to, revoked_at, scope_read, scope_write, scope_upload"
    )
    .eq("animal_id", animalId);

  if (grantsError) {
    throw grantsError;
  }

  const now = Date.now();

  const activeGrant = ((grants ?? []) as AnimalAccessGrantRow[]).find((g) => {
    if (g.revoked_at) return false;
    if (g.status !== "active") return false;

    const validFrom = g.valid_from ? new Date(g.valid_from).getTime() : 0;
    const validTo = g.valid_to ? new Date(g.valid_to).getTime() : Infinity;

    if (Number.isFinite(validFrom) && now < validFrom) return false;
    if (Number.isFinite(validTo) && now > validTo) return false;

    if (!g.scope_read && !g.scope_write && !g.scope_upload) return false;

    if (g.grantee_type === "user" && String(g.grantee_id) === String(userId)) {
      return true;
    }

    if (
      g.grantee_type === "organization" &&
      organizationId &&
      String(g.grantee_id) === String(organizationId)
    ) {
      return true;
    }

    return false;
  });

  return Boolean(activeGrant);
}
