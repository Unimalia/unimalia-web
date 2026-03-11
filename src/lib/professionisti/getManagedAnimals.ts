import { createClient } from "@/lib/supabase/server";

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

export async function getManagedAnimals(userId: string): Promise<ManagedAnimalRow[]> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("org_id")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile?.org_id) {
    console.error("[GET_MANAGED_ANIMALS] professional profile/org missing", profileError);
    return [];
  }

  const orgId = profile.org_id as string;

  const { data: grantRows, error: grantsError } = await supabase
    .from("animal_access_grants")
    .select("animal_id")
    .eq("grantee_id", orgId)
    .eq("status", "active");

  if (grantsError) {
    console.error("[GET_MANAGED_ANIMALS] grants error", grantsError);
  }

  const grantAnimalIds = (grantRows ?? [])
    .map((row: { animal_id: string | null }) => row.animal_id)
    .filter((id): id is string => !!id);

  const { data: orgAnimals, error: orgAnimalsError } = await supabase
    .from("animals")
    .select(`
      id,
      name,
      species,
      breed,
      microchip,
      unimalia_code,
      owner_id,
      owner_claim_status,
      created_by_org_id,
      origin_org_id
    `)
    .or(`created_by_org_id.eq.${orgId},origin_org_id.eq.${orgId}`);

  if (orgAnimalsError) {
    console.error("[GET_MANAGED_ANIMALS] org animals error", orgAnimalsError);
  }

  const orgAnimalIds = (orgAnimals ?? [])
    .map((a: { id: string | null }) => a.id)
    .filter((id): id is string => !!id);

  const mergedIds = Array.from(new Set([...grantAnimalIds, ...orgAnimalIds]));

  if (mergedIds.length === 0) {
    return [];
  }

  const { data: animals, error: animalsError } = await supabase
    .from("animals")
    .select(`
      id,
      name,
      species,
      breed,
      microchip,
      unimalia_code,
      owner_id,
      owner_claim_status,
      created_by_org_id,
      origin_org_id
    `)
    .in("id", mergedIds);

  if (animalsError) {
    console.error("[GET_MANAGED_ANIMALS] animals error", animalsError);
    return [];
  }

  const rows = (animals ?? []) as Omit<ManagedAnimalRow, "owner_name">[];

  const ownerIds = Array.from(
    new Set(rows.map((row) => row.owner_id).filter((id): id is string => !!id))
  );

  let ownerMap = new Map<string, string>();

  if (ownerIds.length > 0) {
    const { data: owners, error: ownersError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds);

    if (ownersError) {
      console.error("[GET_MANAGED_ANIMALS] owners error", ownersError);
    } else {
      ownerMap = new Map(
        (owners ?? []).map((owner: { id: string; full_name: string | null }) => [
          owner.id,
          owner.full_name ?? "",
        ])
      );
    }
  }

  return rows
    .map((row) => ({
      ...row,
      owner_name: row.owner_id ? ownerMap.get(row.owner_id) ?? null : null,
    }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "it"));
}