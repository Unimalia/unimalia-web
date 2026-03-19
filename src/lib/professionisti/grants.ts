import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

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
  const admin = supabaseAdmin();

  const { data: authUserResult, error: authUserError } = await admin.auth.getUser();
  if (authUserError || !authUserResult?.user) {
    return false;
  }

  const userId = authUserResult.user.id;
  const refs = await resolveProfessionalRefs(userId);

  if (refs.length === 0) return false;

  const { data: animal, error: animalError } = await admin
    .from("animals")
    .select("id, owner_id, created_by_org_id, origin_org_id")
    .eq("id", animalId)
    .maybeSingle();

  if (animalError) {
    throw animalError;
  }

  if (!animal) return false;

  const createdOrOriginAccess =
    refs.includes(String(animal.created_by_org_id ?? "")) ||
    refs.includes(String(animal.origin_org_id ?? ""));

  if (createdOrOriginAccess) {
    return true;
  }

  const { data: grants, error: grantsError } = await admin
    .from("animal_access_grants")
    .select(
      "id, grantee_type, grantee_id, status, valid_from, valid_to, revoked_at, scope_read, scope_write"
    )
    .eq("animal_id", animalId)
    .is("revoked_at", null)
    .in("status", ["active", "approved"]);

  if (grantsError) {
    throw grantsError;
  }

  const now = Date.now();

  const activeGrant = (grants ?? []).find((g: any) => {
    const validFrom = g.valid_from ? new Date(g.valid_from).getTime() : 0;
    const validTo = g.valid_to ? new Date(g.valid_to).getTime() : Infinity;

    if (now < validFrom) return false;
    if (now > validTo) return false;

    if (!g.scope_read && !g.scope_write) return false;

    if (g.grantee_type === "user" && g.grantee_id === userId) return true;
    if (g.grantee_type === "org" && refs.includes(String(g.grantee_id))) return true;

    return false;
  });

  return Boolean(activeGrant);
}