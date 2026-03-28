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
  grant_status: "active" | "revoked_own_history" | "clinic_origin";
  has_active_grant: boolean;
  has_own_history: boolean;
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

function buildOwnerName(profile: any): string | null {
  if (!profile) return null;

  const fullName =
    typeof profile.full_name === "string" ? profile.full_name.trim() : "";

  if (fullName) return fullName;

  const firstName =
    typeof profile.first_name === "string" ? profile.first_name.trim() : "";
  const lastName =
    typeof profile.last_name === "string" ? profile.last_name.trim() : "";

  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  return combined || null;
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
    .eq("grantee_type", "organization")
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

  const grantedAnimalIdSet = new Set<string>(grantedAnimalIds);

  const createdOrOriginatedIds = new Set<string>();

  const createdOrOriginatedFilter = refs
    .map((ref) => `created_by_org_id.eq.${ref},origin_org_id.eq.${ref}`)
    .join(",");

  const { data: createdOrOriginated, error: createdError } = await admin
    .from("animals")
    .select("id, created_by_org_id, origin_org_id")
    .or(createdOrOriginatedFilter)
    .limit(5000);

  if (createdError) {
    throw createdError;
  }

  for (const row of createdOrOriginated ?? []) {
    if (row.id) createdOrOriginatedIds.add(row.id);
  }

  const ownHistoryAnimalIds: string[] = [];
  const ownHistoryAnimalIdSet = new Set<string>(ownHistoryAnimalIds);

  const animalIds = Array.from(
    new Set([
      ...grantedAnimalIds,
      ...Array.from(createdOrOriginatedIds),
      ...ownHistoryAnimalIds,
    ])
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
        .filter((v: unknown): v is string => typeof v === "string" && v.length > 0)
    )
  );

  const ownerNameById = new Map<string, string | null>();

  if (ownerIds.length > 0) {
    const { data: profilesById, error: profilesError } = await admin
      .from("profiles")
      .select("id, first_name, last_name, full_name")
      .in("id", ownerIds);

    if (profilesError) {
      throw profilesError;
    }

    for (const profile of profilesById ?? []) {
      ownerNameById.set(profile.id, buildOwnerName(profile));
    }
  }

  return (animals ?? []).map((row: any) => {
    const hasActiveGrant = grantedAnimalIdSet.has(row.id);
    const hasOwnHistory = ownHistoryAnimalIdSet.has(row.id);
    const isClinicOrigin =
      createdOrOriginatedIds.has(row.id) ||
      refs.includes(String(row.created_by_org_id ?? "")) ||
      refs.includes(String(row.origin_org_id ?? ""));

    let grantStatus: "active" | "revoked_own_history" | "clinic_origin" = "clinic_origin";

    if (hasActiveGrant) {
      grantStatus = "active";
    } else if (hasOwnHistory) {
      grantStatus = "revoked_own_history";
    } else if (isClinicOrigin) {
      grantStatus = "clinic_origin";
    }

    return {
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
      owner_name: row.owner_id ? ownerNameById.get(row.owner_id) ?? null : null,
      grant_status: grantStatus,
      has_active_grant: hasActiveGrant,
      has_own_history: hasOwnHistory,
    };
  });
}