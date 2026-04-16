import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export type ManagedAnimalRow = {
  id: string;
  name: string | null;
  species: string | null;
  breed: string | null;
  microchip: string | null;
  unimalia_code: string | null;
  owner_id: string | null;
  owner_claim_status: "none" | "pending" | "claimed" | null;
  created_by_organization_id: string | null;
  origin_organization_id: string | null;
  owner_name: string | null;
  grant_status: "active" | "revoked_own_history" | "clinic_origin";
  has_active_grant: boolean;
  has_own_history: boolean;
};

type GrantRow = {
  animal_id: string | null;
  grantee_id: string | null;
  status: string | null;
  valid_to: string | null;
  revoked_at: string | null;
  scope_read: boolean | null;
  scope_write: boolean | null;
};

type AnimalOriginRow = {
  id: string;
  created_by_organization_id: string | null;
  origin_organization_id: string | null;
};

type AuditRow = {
  animal_id: string | null;
  actor_user_id: string | null;
  actor_organization_id: string | null;
  action: string;
};

type AnimalRow = {
  id: string;
  name: string | null;
  species: string | null;
  breed: string | null;
  chip_number: string | null;
  unimalia_code: string | null;
  owner_id: string | null;
  owner_claim_status: "none" | "pending" | "claimed" | null;
  created_by_organization_id: string | null;
  origin_organization_id: string | null;
};

type OwnerProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
};

async function getProfessionalContext(userId: string) {
  const organizationId = await getProfessionalOrgId(userId);

  if (!organizationId) {
    return {
      organizationId: null,
      organizationRefs: [] as string[],
      auditRefs: [userId].filter(Boolean),
    };
  }

  return {
    organizationId,
    organizationRefs: [organizationId],
    auditRefs: [userId, organizationId].filter(Boolean),
  };
}

function buildOwnerName(profile: OwnerProfileRow | null | undefined): string | null {
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
  const { organizationId, organizationRefs, auditRefs } = await getProfessionalContext(userId);

  if (!organizationId || organizationRefs.length === 0) {
    return [];
  }

  const nowIso = new Date().toISOString();

  const { data: grants, error: grantsError } = await admin
    .from("animal_access_grants")
    .select("animal_id, grantee_id, status, valid_to, revoked_at, scope_read, scope_write")
    .eq("grantee_type", "organization")
    .in("grantee_id", organizationRefs)
    .is("revoked_at", null);

  if (grantsError) {
    throw grantsError;
  }

  const grantRows = (grants ?? []) as GrantRow[];

  const grantedAnimalIds = Array.from(
    new Set(
      grantRows
        .filter((g) => {
          if (g.status !== "active") return false;
          if (!g.scope_read && !g.scope_write) return false;
          if (!g.valid_to) return true;
          return String(g.valid_to) > nowIso;
        })
        .map((g) => g.animal_id)
        .filter((animalId): animalId is string => typeof animalId === "string" && animalId.length > 0)
    )
  );

  const grantedAnimalIdSet = new Set<string>(grantedAnimalIds);

  const createdOrOriginatedIds = new Set<string>();

  const createdOrOriginatedFilter = organizationRefs
    .map(
      (ref) =>
        `created_by_organization_id.eq.${ref},origin_organization_id.eq.${ref}`
    )
    .join(",");

  const { data: createdOrOriginated, error: createdError } = await admin
    .from("animals")
    .select("id, created_by_organization_id, origin_organization_id")
    .or(createdOrOriginatedFilter)
    .limit(5000);

  if (createdError) {
    throw createdError;
  }

  for (const row of (createdOrOriginated ?? []) as AnimalOriginRow[]) {
    if (row.id) createdOrOriginatedIds.add(row.id);
  }

  const ownAuditResult = await admin
    .from("animal_clinic_event_audit")
    .select("animal_id, actor_user_id, actor_organization_id, action")
    .in("action", ["create", "update"]);

  if (ownAuditResult.error) {
    throw ownAuditResult.error;
  }

  const auditRows = (ownAuditResult.data ?? []) as AuditRow[];

  const ownHistoryAnimalIds = Array.from(
    new Set(
      auditRows
        .filter((row) => {
          const actorUserId = String(row.actor_user_id || "").trim();
          const actorOrganizationId = String(row.actor_organization_id || "").trim();

          return actorUserId === userId || auditRefs.includes(actorOrganizationId);
        })
        .map((row) => String(row.animal_id || "").trim())
        .filter(Boolean)
    )
  );

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
      "id, name, species, breed, chip_number, unimalia_code, owner_id, owner_claim_status, created_by_organization_id, origin_organization_id"
    )
    .in("id", animalIds)
    .order("name", { ascending: true });

  if (animalsError) {
    throw animalsError;
  }

  const animalRows = (animals ?? []) as AnimalRow[];

  const ownerIds = Array.from(
    new Set(
      animalRows
        .map((row) => row.owner_id)
        .filter((v): v is string => typeof v === "string" && v.length > 0)
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

    for (const profile of (profilesById ?? []) as OwnerProfileRow[]) {
      ownerNameById.set(profile.id, buildOwnerName(profile));
    }
  }

  return animalRows.map((row) => {
    const hasActiveGrant = grantedAnimalIdSet.has(row.id);
    const hasOwnHistory = ownHistoryAnimalIdSet.has(row.id);
    const isClinicOrigin =
      createdOrOriginatedIds.has(row.id) ||
      organizationRefs.includes(String(row.created_by_organization_id ?? "")) ||
      organizationRefs.includes(String(row.origin_organization_id ?? ""));

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
      created_by_organization_id: row.created_by_organization_id ?? null,
      origin_organization_id: row.origin_organization_id ?? null,
      owner_name: row.owner_id ? ownerNameById.get(row.owner_id) ?? null : null,
      grant_status: grantStatus,
      has_active_grant: hasActiveGrant,
      has_own_history: hasOwnHistory,
    };
  });
}
