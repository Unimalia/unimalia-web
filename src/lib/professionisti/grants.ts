import "server-only";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

async function getAuthenticatedUserId() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return user.id;
}

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

export async function hasActiveGrantForAnimal(animalId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return false;

  const admin = supabaseAdmin();
  const refs = await resolveProfessionalRefs(userId);

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

  const activeGrant = (grants ?? []).find((g: any) => {
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

    if (g.grantee_type === "org" && refs.includes(String(g.grantee_id))) {
      return true;
    }

    return false;
  });

  return Boolean(activeGrant);
}