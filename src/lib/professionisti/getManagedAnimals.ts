// src/lib/professionisti/getManagedAnimals.ts
import "server-only";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

export type ManagedAnimalRow = {
  animal_id: string;
  animal_name: string;
  species: string | null;
  microchip: string | null; // maps to animals.chip_number
  owner_name: string | null;
  last_visit_at: string | null; // temporarily null
  next_reminder_at: string | null; // temporarily null
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

  // org_id del professionista
  const { data: proProfile, error: proErr } = await supabase
    .from("professional_profiles")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (proErr) throw proErr;

  const orgId = (proProfile as any)?.org_id as string | undefined;
  if (!orgId) return [];

  const nowIso = new Date().toISOString();

  // 1) Animali con GRANT ATTIVO
  const { data: grants, error: grantsErr } = await supabase
    .from("animal_access_grants")
    .select("animal_id, valid_to, revoked_at, status, grantee_type, grantee_id")
    .eq("grantee_type", "org")
    .eq("grantee_id", orgId)
    .eq("status", "active")
    .is("revoked_at", null)
    .or(`valid_to.is.null,valid_to.gt.${nowIso}`);

  if (grantsErr) throw grantsErr;

  const grantAnimalIds = Array.from(
    new Set((grants ?? []).map((g: any) => g.animal_id).filter(Boolean))
  );

  // 2) Animali creati / originati dalla ORG corrente (vet-first)
  const admin = supabaseAdmin();

  const { data: orgAnimals, error: orgAnimalsErr } = await admin
    .from("animals")
    .select("id")
    .or(`created_by_org_id.eq.${orgId},origin_org_id.eq.${orgId}`);

  if (orgAnimalsErr) throw orgAnimalsErr;

  const ownedAnimalIds = Array.from(
    new Set((orgAnimals ?? []).map((a: any) => a.id).filter(Boolean))
  );

  // 3) Unione dei due insiemi
  const animalIds = Array.from(new Set([...grantAnimalIds, ...ownedAnimalIds]));

  if (animalIds.length === 0) return [];

  // 4) Carica gli animali finali
  let animalsQuery = admin
    .from("animals")
    .select(
      `
        id,
        name,
        species,
        chip_number,
        status,
        owner_id,
        owner_claim_status,
        created_by_role,
        created_by_org_id,
        origin_org_id,
        owner:profiles!animals_owner_id_fkey(full_name)
      `
    )
    .in("id", animalIds);

  // Ricerca server-side SOLO nel subset visibile
  if (q && q.trim().length >= 2) {
    const qq = q.trim();
    animalsQuery = animalsQuery.or(`name.ilike.%${qq}%,chip_number.ilike.%${qq}%`);
  }

  const { data: animals, error: animalsErr } = await animalsQuery;
  if (animalsErr) throw animalsErr;

  return (animals ?? []).map((a: any) => {
    const ownerName = a.owner?.full_name ?? null;

    return {
      animal_id: a.id,
      animal_name: a.name ?? "",
      species: a.species ?? null,
      microchip: a.chip_number ?? null,
      owner_name: ownerName,
      last_visit_at: null,
      next_reminder_at: null,
      status: a.status ?? "active",
    };
  });
}