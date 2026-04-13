import "server-only";

import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export const CLINIC_OPERATOR_SESSION_TTL_MINUTES = 60;
export const CLINIC_OPERATOR_WORKSTATION_HEADER = "x-workstation-key";

type ProfessionalProfileRow = {
  user_id: string;
  organization_id: string | null;
};

type ProfessionalRow = {
  id: string;
  owner_id: string | null;
  display_name: string | null;
  business_name: string | null;
  first_name: string | null;
  last_name: string | null;
  approved: boolean | null;
  is_vet: boolean | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type OperatorPinRow = {
  id: string;
  organization_id: string;
  user_id: string;
  pin_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClinicOperatorSessionRow = {
  id: string;
  organization_id: string;
  workstation_key: string;
  active_user_id: string;
  active_professional_id: string | null;
  active_operator_label: string;
  pin_verified_at: string;
  last_seen_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type ClinicOperatorOption = {
  userId: string;
  professionalId: string | null;
  label: string;
  isVet: boolean;
};

export function normalizeWorkstationKey(input: string | null | undefined) {
  const raw = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, "");

  if (!raw) return "";
  return raw.slice(0, 120);
}

export function getWorkstationKeyFromRequest(req: Request) {
  return normalizeWorkstationKey(req.headers.get(CLINIC_OPERATOR_WORKSTATION_HEADER));
}

export function isValidOperatorPin(pin: string) {
  return /^\d{4,8}$/.test(String(pin || "").trim());
}

export function hashOperatorPin(pin: string) {
  const normalizedPin = String(pin || "").trim();

  if (!isValidOperatorPin(normalizedPin)) {
    throw new Error("PIN non valido: usa 4-8 cifre numeriche.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(normalizedPin, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyOperatorPin(pin: string, storedHash: string) {
  const normalizedPin = String(pin || "").trim();
  const encoded = String(storedHash || "").trim();

  if (!normalizedPin || !encoded) return false;

  const parts = encoded.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = parts[1];
  const expectedHash = parts[2];

  if (!salt || !expectedHash) return false;

  const actualHash = crypto.scryptSync(normalizedPin, salt, 64).toString("hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = Buffer.from(actualHash, "hex");

  if (expectedBuffer.length !== actualBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function buildOperatorSessionExpiresAt() {
  return new Date(
    Date.now() + CLINIC_OPERATOR_SESSION_TTL_MINUTES * 60 * 1000
  ).toISOString();
}

export async function getCurrentProfessionalOrganizationId(userId: string) {
  return await getProfessionalOrgId(userId);
}

export async function getOperatorPinRow(params: {
  organizationId: string;
  userId: string;
}) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("clinic_operator_pins")
    .select("id, organization_id, user_id, pin_hash, is_active, created_at, updated_at")
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.userId)
    .maybeSingle<OperatorPinRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data ?? null;
}

export async function hasOperatorPinConfigured(params: {
  organizationId: string;
  userId: string;
}) {
  const row = await getOperatorPinRow(params);
  return Boolean(row?.id && row?.is_active && row?.pin_hash);
}

export async function upsertOperatorPin(params: {
  organizationId: string;
  userId: string;
  pin: string;
}) {
  const admin = supabaseAdmin();
  const pinHash = hashOperatorPin(params.pin);

  const result = await admin
    .from("clinic_operator_pins")
    .upsert(
      {
        organization_id: params.organizationId,
        user_id: params.userId,
        pin_hash: pinHash,
        is_active: true,
      },
      { onConflict: "organization_id,user_id" }
    )
    .select("id, organization_id, user_id, pin_hash, is_active, created_at, updated_at")
    .single<OperatorPinRow>();

  if (result.error || !result.data) {
    throw new Error(result.error?.message || "Impossibile salvare il PIN operatore.");
  }

  return result.data;
}

export async function listOrganizationOperators(organizationId: string) {
  const admin = supabaseAdmin();

  const profilesResult = await admin
    .from("professional_profiles")
    .select("user_id, organization_id")
    .eq("organization_id", organizationId)
    .returns<ProfessionalProfileRow[]>();

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  const userIds = Array.from(
    new Set(
      (profilesResult.data ?? [])
        .map((row) => String(row.user_id || "").trim())
        .filter(Boolean)
    )
  );

  if (userIds.length === 0) {
    return [] as ClinicOperatorOption[];
  }

  const professionalsResult = await admin
    .from("professionals")
    .select("id, owner_id, display_name, business_name, first_name, last_name, approved, is_vet")
    .in("owner_id", userIds)
    .returns<ProfessionalRow[]>();

  if (professionalsResult.error) {
    throw professionalsResult.error;
  }

  const profilesTableResult = await admin
    .from("profiles")
    .select("id, full_name, first_name, last_name")
    .in("id", userIds)
    .returns<ProfileRow[]>();

  if (profilesTableResult.error) {
    throw profilesTableResult.error;
  }

  const professionalByUserId = new Map<string, ProfessionalRow>();
  for (const professional of professionalsResult.data ?? []) {
    const ownerId = String(professional.owner_id || "").trim();
    if (!ownerId) continue;
    if (!professionalByUserId.has(ownerId)) {
      professionalByUserId.set(ownerId, professional);
    }
  }

  const profileByUserId = new Map<string, ProfileRow>();
  for (const profile of profilesTableResult.data ?? []) {
    const profileId = String(profile.id || "").trim();
    if (!profileId) continue;
    profileByUserId.set(profileId, profile);
  }

  const operators: ClinicOperatorOption[] = userIds.map((userId) => {
    const professional = professionalByUserId.get(userId) ?? null;
    const profile = profileByUserId.get(userId) ?? null;

    const label =
      professional?.display_name?.trim() ||
      professional?.business_name?.trim() ||
      [professional?.first_name, professional?.last_name].filter(Boolean).join(" ").trim() ||
      profile?.full_name?.trim() ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      `Operatore ${userId.slice(0, 8)}`;

    return {
      userId,
      professionalId: professional?.id ?? null,
      label,
      isVet: Boolean(professional?.is_vet),
    };
  });

  operators.sort((a, b) => a.label.localeCompare(b.label, "it"));
  return operators;
}

export async function resolveOrganizationOperator(params: {
  organizationId: string;
  userId: string;
}) {
  const operators = await listOrganizationOperators(params.organizationId);
  return operators.find((operator) => operator.userId === params.userId) ?? null;
}

export async function getOperatorSession(params: {
  organizationId: string;
  workstationKey: string;
}) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("clinic_operator_sessions")
    .select(
      "id, organization_id, workstation_key, active_user_id, active_professional_id, active_operator_label, pin_verified_at, last_seen_at, expires_at, created_at, updated_at"
    )
    .eq("organization_id", params.organizationId)
    .eq("workstation_key", params.workstationKey)
    .maybeSingle<ClinicOperatorSessionRow>();

  if (result.error) {
    throw result.error;
  }

  const session = result.data ?? null;
  if (!session) return null;

  const expiresAtMs = new Date(session.expires_at).getTime();
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
    await clearOperatorSession(params).catch(() => undefined);
    return null;
  }

  return session;
}

export async function upsertOperatorSession(params: {
  organizationId: string;
  workstationKey: string;
  activeUserId: string;
  activeProfessionalId: string | null;
  activeOperatorLabel: string;
}) {
  const admin = supabaseAdmin();
  const nowIso = new Date().toISOString();
  const expiresAt = buildOperatorSessionExpiresAt();

  const result = await admin
    .from("clinic_operator_sessions")
    .upsert(
      {
        organization_id: params.organizationId,
        workstation_key: params.workstationKey,
        active_user_id: params.activeUserId,
        active_professional_id: params.activeProfessionalId,
        active_operator_label: params.activeOperatorLabel,
        pin_verified_at: nowIso,
        last_seen_at: nowIso,
        expires_at: expiresAt,
      },
      { onConflict: "organization_id,workstation_key" }
    )
    .select(
      "id, organization_id, workstation_key, active_user_id, active_professional_id, active_operator_label, pin_verified_at, last_seen_at, expires_at, created_at, updated_at"
    )
    .single<ClinicOperatorSessionRow>();

  if (result.error || !result.data) {
    throw new Error(result.error?.message || "Impossibile attivare la sessione operatore.");
  }

  return result.data;
}

export async function heartbeatOperatorSession(params: {
  organizationId: string;
  workstationKey: string;
}) {
  const admin = supabaseAdmin();
  const expiresAt = buildOperatorSessionExpiresAt();
  const nowIso = new Date().toISOString();

  const result = await admin
    .from("clinic_operator_sessions")
    .update({
      last_seen_at: nowIso,
      expires_at: expiresAt,
    })
    .eq("organization_id", params.organizationId)
    .eq("workstation_key", params.workstationKey)
    .select(
      "id, organization_id, workstation_key, active_user_id, active_professional_id, active_operator_label, pin_verified_at, last_seen_at, expires_at, created_at, updated_at"
    )
    .maybeSingle<ClinicOperatorSessionRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data ?? null;
}

export async function clearOperatorSession(params: {
  organizationId: string;
  workstationKey: string;
}) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("clinic_operator_sessions")
    .delete()
    .eq("organization_id", params.organizationId)
    .eq("workstation_key", params.workstationKey);

  if (result.error) {
    throw result.error;
  }

  return true;
}