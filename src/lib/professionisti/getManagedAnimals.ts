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

export async function getManagedAnimals(): Promise<ManagedAnimalRow[]> {
  const supabase = await createServerSupabaseClient();

  // 1) Utente loggato (server)
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  // ✅ Non facciamo crashare la pagina se manca sessione server
  // (capita prima che middleware/cookie siano ok o se non sei loggato)
  if (userErr || !user) return [];

  // 2) Recupera org_id del professionista (TODO: tabella/campo reale)
  const { data: proProfile, error: proErr } = await supabase
    .from("professional_profiles") // TODO: nome tabella reale
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (proErr) throw proErr;

  const orgId = (proProfile as any)?.org_id as string | undefined;
  if (!orgId) return [];

  // 3) Grants attivi
  const nowIso = new Date().toISOString();

  const { data: grants, error: grantsErr } = await supabase
    .from("animal_access_grants")
    .select("animal_id")
    .eq("org_id", orgId)
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  if (grantsErr) throw grantsErr;

  const animalIds = (grants ?? [])
    .map((g: any) => g.animal_id as string)
    .filter(Boolean);

  if (animalIds.length === 0) return [];

  // 4) Animali + owner (TODO: join reale se il vincolo non è animals_owner_id_fkey)
  const { data: animals, error: animalsErr } = await supabase
    .from("animals")
    .select(
      `
      id,
      name,
      species,
      microchip,
      status,
      owner_id,
      owner:profiles!animals_owner_id_fkey(full_name)
    `
    )
    .in("id", animalIds);

  if (animalsErr) throw animalsErr;

  // 5) last_visit / next_reminder (starter semplice)
  const { data: events, error: eventsErr } = await supabase
    .from("animal_clinic_events")
    .select("animal_id, occurred_at, reminder_at, deleted_at, is_validated")
    .in("animal_id", animalIds)
    .is("deleted_at", null);

  if (eventsErr) throw eventsErr;

  const byAnimal = new Map<string, { last: string | null; next: string | null }>();

  for (const ev of events ?? []) {
    const aid = (ev as any).animal_id as string;
    const occurredAt = (ev as any).occurred_at as string | null;
    const reminderAt = (ev as any).reminder_at as string | null;
    const isValidated = Boolean((ev as any).is_validated);

    if (isValidated && occurredAt) {
      const cur = byAnimal.get(aid)?.last;
      if (!cur || occurredAt > cur) {
        byAnimal.set(aid, { last: occurredAt, next: byAnimal.get(aid)?.next ?? null });
      }
    }

    if (reminderAt && reminderAt > nowIso) {
      const curNext = byAnimal.get(aid)?.next;
      if (!curNext || reminderAt < curNext) {
        byAnimal.set(aid, { last: byAnimal.get(aid)?.last ?? null, next: reminderAt });
      }
    }
  }

  return (animals ?? []).map((a: any) => {
    const agg = byAnimal.get(a.id) ?? { last: null, next: null };

    return {
      animal_id: a.id,
      animal_name: a.name ?? "",
      species: a.species ?? null,
      microchip: a.microchip ?? null,
      owner_name: a.owner?.full_name ?? null,
      last_visit_at: agg.last,
      next_reminder_at: agg.next,
      status: a.status ?? "active",
    };
  });
}