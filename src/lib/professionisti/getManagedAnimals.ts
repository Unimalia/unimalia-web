// src/lib/professionisti/getManagedAnimals.ts
import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

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

export async function getManagedAnimals(q?: string): Promise<ManagedAnimalRow[]> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // ✅ ORG ID come nel resto del portale (grants/check)
  const orgId = await getProfessionalOrgId();
  if (!orgId) return [];

  const nowIso = new Date().toISOString();

  // ✅ schema corretto: grantee_type + grantee_id + valid_to
  const { data: grants, error: grantsErr } = await supabase
    .from("animal_access_grants")
    .select("animal_id, valid_to, revoked_at, status")
    .eq("grantee_type", "org")
    .eq("grantee_id", orgId)
    .is("revoked_at", null)
    .or(`valid_to.is.null,valid_to.gt.${nowIso}`);

  if (grantsErr) throw grantsErr;

  const animalIds = (grants ?? []).map((g: any) => g.animal_id).filter(Boolean);
  if (animalIds.length === 0) return [];

  // animals + owner
  let animalsQuery = supabase
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

  if (q && q.trim().length >= 2) {
    const qq = q.trim();
    animalsQuery = animalsQuery.or(`name.ilike.%${qq}%,microchip.ilike.%${qq}%`);
  }

  const { data: animals, error: animalsErr } = await animalsQuery;
  if (animalsErr) throw animalsErr;

  // events aggregate (starter)
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
      if (!cur || occurredAt > cur)
        byAnimal.set(aid, { last: occurredAt, next: byAnimal.get(aid)?.next ?? null });
    }

    if (reminderAt && reminderAt > nowIso) {
      const curNext = byAnimal.get(aid)?.next;
      if (!curNext || reminderAt < curNext)
        byAnimal.set(aid, { last: byAnimal.get(aid)?.last ?? null, next: reminderAt });
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