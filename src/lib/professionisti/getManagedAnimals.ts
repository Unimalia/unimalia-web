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

async function getProfessionalRefs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const refs = new Set<string>();
  refs.add(userId);

  const byUserId = await supabase
    .from("professional_profiles")
    .select("id, org_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUserId.data?.id) refs.add(byUserId.data.id);
  if (byUserId.data?.org_id) refs.add(byUserId.data.org_id);

  const byId = await supabase
    .from("professional_profiles")
    .select("id, org_id, user_id")
    .eq("id", userId)
    .maybeSingle();

  if (byId.data?.id) refs.add(byId.data.id);
  if (byId.data?.org_id) refs.add(byId.data.org_id);
  if ((byId.data as any)?.user_id) refs.add((byId.data as any).user_id);

  return Array.from(refs).filter(Boolean);
}

export async function getManagedAnimals(userId: string): Promise<ManagedAnimalRow[]> {
  const supabase = await createClient();

  const refs = await getProfessionalRefs(supabase, userId);

  if (refs.length === 0) {
    console.error("[GET_MANAGED_ANIMALS] no professional refs found", { userId });
    return [];
  }

  const allAnimalIds = new Set<string>();
  const directAnimals = new Map<string, Omit<ManagedAnimalRow, "owner_name">>();

  for (const ref of refs) {
    const { data: grantRows, error: grantsError } = await supabase
      .from("animal_access_grants")
      .select("animal_id")
      .eq("grantee_id", ref)
      .eq("status", "active");

    if (grantsError) {
      console.error("[GET_MANAGED_ANIMALS] grants error", { ref, grantsError });
    }

    for (const row of grantRows ?? []) {
      if ((row as any).animal_id) {
        allAnimalIds.add((row as any).animal_id);
      }
    }

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
      .or(`created_by_org_id.eq.${ref},origin_org_id.eq.${ref}`);

    if (orgAnimalsError) {
      console.error("[GET_MANAGED_ANIMALS] org animals error", { ref, orgAnimalsError });
    }

    for (const animal of orgAnimals ?? []) {
      if ((animal as any).id) {
        allAnimalIds.add((animal as any).id);
        directAnimals.set((animal as any).id, animal as Omit<ManagedAnimalRow, "owner_name">);
      }
    }
  }

  if (allAnimalIds.size === 0) {
    return [];
  }

  const ids = Array.from(allAnimalIds);

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
    .in("id", ids);

  if (animalsError) {
    console.error("[GET_MANAGED_ANIMALS] animals error", animalsError);

    const fallbackRows = Array.from(directAnimals.values());
    return fallbackRows
      .map((row) => ({
        ...row,
        owner_name: null,
      }))
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "it"));
  }

  const rows = ((animals ?? []).length
    ? animals
    : Array.from(directAnimals.values())) as Omit<ManagedAnimalRow, "owner_name">[];

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