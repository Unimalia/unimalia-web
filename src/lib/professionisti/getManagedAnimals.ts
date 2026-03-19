import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

export type ManagedAnimalRow = {
  id: string;
  name: string | null;
  species: string | null;
  breed: string | null;
  microchip: string | null;
  unimalia_code: string | null;
  owner_id: string | null;
  owner_claim_status: "none" | "pending" | "claimed" | null;
  created_by_org_id: string | null;
  origin_org_id: string | null;
  owner_name: string | null;
};

async function getProfessionalRefs(userId: string) {
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

function normalizeOwnerNameFromMetadata(metadata: Record<string, any> | null | undefined) {
  if (!metadata || typeof metadata !== "object") return null;

  const firstName =
    typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
  const lastName =
    typeof metadata.last_name === "string" ? metadata.last_name.trim() : "";
  const fullName =
    typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const name =
    typeof metadata.name === "string" ? metadata.name.trim() : "";
  const givenName =
    typeof metadata.given_name === "string" ? metadata.given_name.trim() : "";
  const familyName =
    typeof metadata.family_name === "string" ? metadata.family_name.trim() : "";

  const combinedFirstLast = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (combinedFirstLast) return combinedFirstLast;

  if (fullName) return fullName;
  if (name) return name;

  const combinedGivenFamily = [givenName, familyName].filter(Boolean).join(" ").trim();
  if (combinedGivenFamily) return combinedGivenFamily;

  return null;
}

async function getOwnerNamesMap(ownerIds: string[]) {
  const admin = supabaseAdmin();
  const ownerNames = new Map<string, string | null>();

  for (const ownerId of ownerIds) {
    if (!ownerId) continue;

    try {
      const { data, error } = await admin.auth.admin.getUserById(ownerId);

      if (error) {
        ownerNames.set(ownerId, null);
        continue;
      }

      const user = data?.user;
      const metadata = (user?.user_metadata ?? {}) as Record<string, any>;
      const appMetadata = (user?.app_metadata ?? {}) as Record<string, any>;

      const normalized =
        normalizeOwnerNameFromMetadata(metadata) ||
        normalizeOwnerNameFromMetadata(appMetadata) ||
        (typeof user?.email === "string" ? user.email.trim() : null) ||
        null;

      ownerNames.set(ownerId, normalized);
    } catch {
      ownerNames.set(ownerId, null);
    }
  }

  return ownerNames;
}

export async function getManagedAnimals(userId: string): Promise<ManagedAnimalRow[]> {
  const admin = supabaseAdmin();
  const refs = await getProfessionalRefs(userId);

  if (refs.length === 0) {
    return [];
  }

  const nowIso = new Date().toISOString();

  const { data: grants, error: grantsError } = await admin
    .from("animal_access_grants")
    .select("animal_id, grantee_id, status, valid_to, revoked_at, scope_read, scope_write")
    .eq("grantee_type", "org")
    .in("grantee_id", refs)
    .is("revoked_at", null);

  if (grantsError) {
    throw grantsError;
  }

  const grantedAnimalIds = Array.from(
    new Set(
      (grants ?? [])
        .filter((g: any) => {
          if (g.status !== "active" && g.status !== "approved") return false;
          if (!g.scope_read && !g.scope_write) return false;
          if (!g.valid_to) return true;
          return String(g.valid_to) > nowIso;
        })
        .map((g: any) => g.animal_id)
        .filter(Boolean)
    )
  );

  const createdOrOriginatedIds = new Set<string>();

  const { data: createdOrOriginated, error: createdError } = await admin
    .from("animals")
    .select("id, created_by_org_id, origin_org_id")
    .or(
      refs
        .map((ref) => `created_by_org_id.eq.${ref},origin_org_id.eq.${ref}`)
        .join(",")
    )
    .limit(5000);

  if (createdError) {
    throw createdError;
  }

  for (const row of createdOrOriginated ?? []) {
    if (row.id) createdOrOriginatedIds.add(row.id);
  }

  const animalIds = Array.from(
    new Set([...grantedAnimalIds, ...Array.from(createdOrOriginatedIds)])
  );

  if (animalIds.length === 0) {
    return [];
  }

  const { data: animals, error: animalsError } = await admin
    .from("animals")
    .select(
      "id, name, species, breed, chip_number, unimalia_code, owner_id, owner_claim_status, created_by_org_id, origin_org_id"
    )
    .in("id", animalIds)
    .order("name", { ascending: true });

  if (animalsError) {
    throw animalsError;
  }

  const ownerIds = Array.from(
    new Set(
      (animals ?? [])
        .map((row: any) => row.owner_id)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const ownerNamesMap = await getOwnerNamesMap(ownerIds);

  return (animals ?? []).map((row: any) => ({
    id: row.id,
    name: row.name ?? null,
    species: row.species ?? null,
    breed: row.breed ?? null,
    microchip: row.chip_number ?? null,
    unimalia_code: row.unimalia_code ?? null,
    owner_id: row.owner_id ?? null,
    owner_claim_status: row.owner_claim_status ?? null,
    created_by_org_id: row.created_by_org_id ?? null,
    origin_org_id: row.origin_org_id ?? null,
    owner_name: row.owner_id ? ownerNamesMap.get(row.owner_id) ?? null : null,
  }));
}