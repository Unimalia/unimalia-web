// src/lib/professionisti/getManagedAnimals.ts
import "server-only";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

export type ManagedAnimalRow = {
  animal_id: string;
  animal_name: string;
  species: string | null;
  microchip: string | null; // maps to animals.chip_number
  owner_name: string | null;
  last_visit_at: string | null; // temporarily null (clinic events schema mismatch)
  next_reminder_at: string | null; // temporarily null (clinic events schema mismatch)
  status: "active" | "inactive" | string;
};

export function normalizeForSearch(v: unknown) {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

// q facoltativo (ricerca SOLO nel subset autorizzato)
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

  // Grants ATTIVI (schema corretto: grantee_type/grantee_id + valid_to)
  const { data: grants, error: grantsErr } = await supabase
    .from("animal_access_grants")
    .select("animal_id, valid_to, revoked_at, status, grantee_type, grantee_id")
    .eq("grantee_type", "org")
    .eq("grantee_id", orgId)
    .eq("status", "active")
    .is("revoked_at", null)
    .or(`valid_to.is.null,valid_to.gt.${nowIso}`);

  if (grantsErr) throw grantsErr;

  const animalIds = Array.from(
    new Set((grants ?? []).map((g: any) => g.animal_id).filter(Boolean))
  );

  if (animalIds.length === 0) return [];

  // Query animals (admin: evita problemi RLS durante demo / superaccount)
  const admin = supabaseAdmin();

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
        owner:profiles!animals_owner_id_fkey(full_name)
      `
    )
    .in("id", animalIds);

  // Search server-side SOLO sul subset autorizzato
  if (q && q.trim().length >= 2) {
    const qq = q.trim();
    animalsQuery = animalsQuery.or(`name.ilike.%${qq}%,chip_number.ilike.%${qq}%`);
  }

  const { data: animals, error: animalsErr } = await animalsQuery;
  if (animalsErr) throw animalsErr;

  // ✅ TEMP: niente eventi clinici (il tuo schema non ha occurred_at)
  // last_visit_at / next_reminder_at rimangono null finché non allineiamo i nomi colonne reali

  return (animals ?? []).map((a: any) => {
    return {
      animal_id: a.id,
      animal_name: a.name ?? "",
      species: a.species ?? null,
      microchip: a.chip_number ?? null,
      owner_name: a.owner?.full_name ?? null,
      last_visit_at: null,
      next_reminder_at: null,
      status: a.status ?? "active",
    };
  });
}