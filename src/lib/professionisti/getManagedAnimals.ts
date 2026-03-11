// src/lib/professionisti/getManagedAnimals.ts
import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ManagedAnimalRow = {
  animal_id: string;
  animal_name: string;
  species: string | null;
  microchip: string | null;
  owner_name: string | null;
  last_visit_at: string | null;
  next_reminder_at: string | null;
  status: "active" | "inactive" | string;
};

export function normalizeForSearch(v: unknown) {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

// q facoltativo (ricerca SOLO nel subset visibile al professionista)
export async function getManagedAnimals(q?: string): Promise<ManagedAnimalRow[]> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile?.org_id) {
    return [];
  }

  const orgId = profile.org_id;

  const { data: grantedRows, error: grantedError } = await supabase
    .from("animal_access_grants")
    .select(`
      animal_id,
      animals!inner(
        id,
        name,
        species,
        breed,
        microchip,
        unimalia_code,
        owner_id,
        owner_claim_status,
        created_by_org_id,
        origin_org_id,
        status
      )
    `)
    .eq("grantee_id", orgId)
    .eq("status", "active");

  if (grantedError) throw grantedError;

  const grantedAnimals =
    grantedRows?.map((row: any) => row.animals).filter(Boolean) ?? [];

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
      origin_org_id,
      status
    `)
    .or(`created_by_org_id.eq.${orgId},origin_org_id.eq.${orgId}`);

  if (orgAnimalsError) throw orgAnimalsError;

  const map = new Map<string, any>();

  for (const animal of grantedAnimals) {
    map.set(animal.id, animal);
  }

  for (const animal of orgAnimals ?? []) {
    map.set(animal.id, animal);
  }

  let animals = Array.from(map.values());

  // Ricerca server-side SOLO nel subset visibile
  if (q && q.trim().length >= 2) {
    const qq = normalizeForSearch(q);

    animals = animals.filter((animal: any) => {
      const byName = normalizeForSearch(animal.name).includes(qq);
      const byChip = normalizeForSearch(animal.microchip).includes(qq);
      return byName || byChip;
    });
  }

  const ownerIds = Array.from(
    new Set(
      animals
        .map((a: any) => a.owner_id)
        .filter(Boolean)
    )
  );

  let ownersMap = new Map<string, string>();

  if (ownerIds.length) {
    const { data: owners, error: ownersError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds);

    if (ownersError) throw ownersError;

    ownersMap = new Map((owners ?? []).map((o: any) => [o.id, o.full_name]));
  }

  return animals
    .map((animal: any) => ({
      animal_id: animal.id,
      animal_name: animal.name ?? "",
      species: animal.species ?? null,
      microchip: animal.microchip ?? null,
      owner_name: animal.owner_id ? ownersMap.get(animal.owner_id) ?? null : null,
      last_visit_at: null,
      next_reminder_at: null,
      status: animal.status ?? "active",
    }))
    .sort((a, b) => a.animal_name.localeCompare(b.animal_name));
}