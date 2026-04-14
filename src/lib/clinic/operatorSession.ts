import "server-only";

import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export const CLINIC_OPERATOR_SESSION_TTL_MINUTES = 60;
export const CLINIC_OPERATOR_WORKSTATION_HEADER = "x-workstation-key";

type ClinicOperatorRow = {
  id: string;
  organization_id: string;
  user_id: string | null;
  professional_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  role: string;
  is_veterinarian: boolean;
  is_prescriber: boolean;
  fnovi_number: string | null;
  fnovi_province: string | null;
  tax_code: string | null;
  email: string | null;
  phone: string | null;
  approval_status: string;
  approved_by_medical_director_user_id: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  is_medical_director: boolean;
  can_manage_operators: boolean;
  can_use_rev: boolean;
  rev_enabled: boolean;
  rev_integration_status: string;
  rev_last_auth_at: string | null;
  rev_linked_at: string | null;
  rev_external_subject_id: string | null;
  rev_auth_method: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type OperatorPinRow = {
  id: string;
  organization_id: string;
  clinic_operator_id: string;
  pin_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClinicOperatorSessionRow = {
  id: string;
  organization_id: string;
  workstation_key: string;
  active_user_id: string | null;
  active_professional_id: string | null;
  active_operator_label: string;
  pin_verified_at: string;
  last_seen_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  active_clinic_operator_id: string | null;
  active_operator_role: string | null;
  active_operator_is_veterinarian: boolean | null;
  active_operator_fnovi_number: string | null;
  active_operator_fnovi_province: string | null;
  signature_mode: string | null;
};

export type ClinicOperatorOption = {
  clinicOperatorId: string;
  userId: string | null;
  professionalId: string | null;
  label: string;
  role: string;
  isVet: boolean;
  isPrescriber: boolean;
  fnoviNumber: string | null;
  fnoviProvince: string | null;
  approvalStatus: string;
  isActive: boolean;
  canUseRev: boolean;
  isMedicalDirector: boolean;
  canManageOperators: boolean;
};

export type CreateClinicOperatorInput = {
  organizationId: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  role: string;
  isVeterinarian: boolean;
  isPrescriber?: boolean;
  fnoviNumber?: string | null;
  fnoviProvince?: string | null;
  taxCode?: string | null;
  email?: string | null;
  phone?: string | null;
  approvalStatus?: string;
  approvedByMedicalDirectorUserId?: string | null;
  approvedAt?: string | null;
  approvalNotes?: string | null;
  isMedicalDirector?: boolean;
  canManageOperators?: boolean;
  canUseRev?: boolean;
  revEnabled?: boolean;
  revIntegrationStatus?: string;
  userId?: string | null;
  professionalId?: string | null;
};

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim();
}

function normalizeNullableText(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeProvince(value: string | null | undefined) {
  const normalized = normalizeText(value).toUpperCase();
  return normalized || null;
}

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

export async function listClinicOperators(organizationId: string) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("clinic_operators")
    .select(
      "id, organization_id, user_id, professional_id, first_name, last_name, display_name, role, is_veterinarian, is_prescriber, fnovi_number, fnovi_province, tax_code, email, phone, approval_status, approved_by_medical_director_user_id, approved_at, approval_notes, is_medical_director, can_manage_operators, can_use_rev, rev_enabled, rev_integration_status, rev_last_auth_at, rev_linked_at, rev_external_subject_id, rev_auth_method, is_active, created_at, updated_at"
    )
    .eq("organization_id", organizationId)
    .order("display_name", { ascending: true })
    .returns<ClinicOperatorRow[]>();

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) => ({
    clinicOperatorId: row.id,
    userId: row.user_id,
    professionalId: row.professional_id,
    label: row.display_name,
    role: row.role,
    isVet: Boolean(row.is_veterinarian),
    isPrescriber: Boolean(row.is_prescriber),
    fnoviNumber: row.fnovi_number,
    fnoviProvince: row.fnovi_province,
    approvalStatus: row.approval_status,
    isActive: Boolean(row.is_active),
    canUseRev: Boolean(row.can_use_rev),
    isMedicalDirector: Boolean(row.is_medical_director),
    canManageOperators: Boolean(row.can_manage_operators),
  })) as ClinicOperatorOption[];
}

export async function listOrganizationOperators(organizationId: string) {
  return await listClinicOperators(organizationId);
}

export async function getClinicOperatorById(params: {
  organizationId: string;
  clinicOperatorId: string;
}) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("clinic_operators")
    .select(
      "id, organization_id, user_id, professional_id, first_name, last_name, display_name, role, is_veterinarian, is_prescriber, fnovi_number, fnovi_province, tax_code, email, phone, approval_status, approved_by_medical_director_user_id, approved_at, approval_notes, is_medical_director, can_manage_operators, can_use_rev, rev_enabled, rev_integration_status, rev_last_auth_at, rev_linked_at, rev_external_subject_id, rev_auth_method, is_active, created_at, updated_at"
    )
    .eq("organization_id", params.organizationId)
    .eq("id", params.clinicOperatorId)
    .maybeSingle<ClinicOperatorRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data ?? null;
}

export async function resolveOrganizationOperator(params: {
  organizationId: string;
  userId?: string | null;
  clinicOperatorId?: string | null;
}) {
  const admin = supabaseAdmin();
  const selectColumns =
    "id, organization_id, user_id, professional_id, first_name, last_name, display_name, role, is_veterinarian, is_prescriber, fnovi_number, fnovi_province, tax_code, email, phone, approval_status, approved_by_medical_director_user_id, approved_at, approval_notes, is_medical_director, can_manage_operators, can_use_rev, rev_enabled, rev_integration_status, rev_last_auth_at, rev_linked_at, rev_external_subject_id, rev_auth_method, is_active, created_at, updated_at";

  const toOption = (row: ClinicOperatorRow): ClinicOperatorOption => ({
    clinicOperatorId: row.id,
    userId: row.user_id,
    professionalId: row.professional_id,
    label: row.display_name,
    role: row.role,
    isVet: Boolean(row.is_veterinarian),
    isPrescriber: Boolean(row.is_prescriber),
    fnoviNumber: row.fnovi_number,
    fnoviProvince: row.fnovi_province,
    approvalStatus: row.approval_status,
    isActive: Boolean(row.is_active),
    canUseRev: Boolean(row.can_use_rev),
    isMedicalDirector: Boolean(row.is_medical_director),
    canManageOperators: Boolean(row.can_manage_operators),
  });

  const toOption = (row: ClinicOperatorRow): ClinicOperatorOption => ({
    clinicOperatorId: row.id,
    userId: row.user_id,
    professionalId: row.professional_id,
    label: row.display_name,
    role: row.role,
    isVet: Boolean(row.is_veterinarian),
    isPrescriber: Boolean(row.is_prescriber),
    fnoviNumber: row.fnovi_number,
    fnoviProvince: row.fnovi_province,
    approvalStatus: row.approval_status,
    isActive: Boolean(row.is_active),
    canUseRev: Boolean(row.can_use_rev),
    isMedicalDirector: Boolean(row.is_medical_director),
    canManageOperators: Boolean(row.can_manage_operators),
  });

  if (params.clinicOperatorId) {
    const byId = await admin
      .from("clinic_operators")
      .select(selectColumns)
      .eq("organization_id", params.organizationId)
      .eq("id", params.clinicOperatorId)
      .maybeSingle<ClinicOperatorRow>();

    if (byId.error) {
      throw byId.error;
    }

    if (!byId.data) return null;

    return toOption(byId.data);
  }

  if (params.userId) {
    const byUser = await admin
      .from("clinic_operators")
      .select(selectColumns)
      .eq("organization_id", params.organizationId)
      .eq("user_id", params.userId)
      .maybeSingle<ClinicOperatorRow>();

    if (byUser.error) {
      throw byUser.error;
    }

    if (byUser.data) {
      return toOption(byUser.data);
    }

    const professionalByOwner = await admin
      .from("professionals")
      .select("id")
      .eq("owner_id", params.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (professionalByOwner.error) {
      throw professionalByOwner.error;
    }

    const professionalId = professionalByOwner.data?.id ?? null;
    if (professionalId) {
      console.info("[resolveOrganizationOperator] Found professional for user", {
        userId: params.userId,
        organizationId: params.organizationId,
        professionalId,
      });

    const byProfessional = await admin
      .from("clinic_operators")
      .select(selectColumns)
      .eq("organization_id", params.organizationId)
      .eq("professional_id", professionalId)
      .maybeSingle<ClinicOperatorRow>();

    if (byProfessional.error) {
      throw byProfessional.error;
    }

    if (!byProfessional.data) {
      return null;
    }

    return toOption(byProfessional.data);
  }

  return null;
}

export async function createClinicOperator(input: CreateClinicOperatorInput) {
  const admin = supabaseAdmin();

  const firstName = normalizeText(input.firstName);
  const lastName = normalizeText(input.lastName);
  const displayName =
    normalizeText(input.displayName) || `${firstName} ${lastName}`.trim();
  const role = normalizeText(input.role);

  if (!firstName || !lastName || !displayName || !role) {
    throw new Error("Dati operatore incompleti.");
  }

  const isVeterinarian = Boolean(input.isVeterinarian);
  const fnoviNumber = normalizeNullableText(input.fnoviNumber);
  const fnoviProvince = normalizeProvince(input.fnoviProvince);

  if (isVeterinarian && (!fnoviNumber || !fnoviProvince)) {
    throw new Error("Per un veterinario numero FNOVI e provincia albo sono obbligatori.");
  }

  const result = await admin
    .from("clinic_operators")
    .insert({
      organization_id: input.organizationId,
      user_id: normalizeNullableText(input.userId),
      professional_id: normalizeNullableText(input.professionalId),
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      role,
      is_veterinarian: isVeterinarian,
      is_prescriber: Boolean(input.isPrescriber),
      fnovi_number: isVeterinarian ? fnoviNumber : null,
      fnovi_province: isVeterinarian ? fnoviProvince : null,
      tax_code: normalizeNullableText(input.taxCode),
      email: normalizeNullableText(input.email),
      phone: normalizeNullableText(input.phone),
      approval_status: normalizeText(input.approvalStatus) || "pending_director_approval",
      approved_by_medical_director_user_id: normalizeNullableText(
        input.approvedByMedicalDirectorUserId
      ),
      approved_at: normalizeNullableText(input.approvedAt),
      approval_notes: normalizeNullableText(input.approvalNotes),
      is_medical_director: Boolean(input.isMedicalDirector),
      can_manage_operators: Boolean(input.canManageOperators),
      can_use_rev: Boolean(input.canUseRev),
      rev_enabled: Boolean(input.revEnabled),
      rev_integration_status:
        normalizeText(input.revIntegrationStatus) || "not_configured",
    })
    .select(
      "id, organization_id, user_id, professional_id, first_name, last_name, display_name, role, is_veterinarian, is_prescriber, fnovi_number, fnovi_province, tax_code, email, phone, approval_status, approved_by_medical_director_user_id, approved_at, approval_notes, is_medical_director, can_manage_operators, can_use_rev, rev_enabled, rev_integration_status, rev_last_auth_at, rev_linked_at, rev_external_subject_id, rev_auth_method, is_active, created_at, updated_at"
    )
    .single<ClinicOperatorRow>();

  if (result.error || !result.data) {
    throw new Error(result.error?.message || "Impossibile creare l’operatore clinico.");
  }

  return result.data;
}

export async function getOperatorPinRow(params: {
  organizationId: string;
  clinicOperatorId: string;
}) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("clinic_operator_pins_v2")
    .select("id, organization_id, clinic_operator_id, pin_hash, is_active, created_at, updated_at")
    .eq("organization_id", params.organizationId)
    .eq("clinic_operator_id", params.clinicOperatorId)
    .maybeSingle<OperatorPinRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data ?? null;
}

export async function hasOperatorPinConfigured(params: {
  organizationId: string;
  clinicOperatorId: string;
}) {
  const row = await getOperatorPinRow(params);
  return Boolean(row?.id && row?.is_active && row?.pin_hash);
}

export async function upsertOperatorPin(params: {
  organizationId: string;
  clinicOperatorId: string;
  pin: string;
}) {
  const admin = supabaseAdmin();
  const pinHash = hashOperatorPin(params.pin);

  const result = await admin
    .from("clinic_operator_pins_v2")
    .upsert(
      {
        organization_id: params.organizationId,
        clinic_operator_id: params.clinicOperatorId,
        pin_hash: pinHash,
        is_active: true,
      },
      { onConflict: "organization_id,clinic_operator_id" }
    )
    .select("id, organization_id, clinic_operator_id, pin_hash, is_active, created_at, updated_at")
    .single<OperatorPinRow>();

  if (result.error || !result.data) {
    throw new Error(result.error?.message || "Impossibile salvare il PIN operatore.");
  }

  return result.data;
}

export async function getOperatorSession(params: {
  organizationId: string;
  workstationKey: string;
}) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("clinic_operator_sessions")
    .select(
      "id, organization_id, workstation_key, active_user_id, active_professional_id, active_operator_label, pin_verified_at, last_seen_at, expires_at, created_at, updated_at, active_clinic_operator_id, active_operator_role, active_operator_is_veterinarian, active_operator_fnovi_number, active_operator_fnovi_province, signature_mode"
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
  clinicOperatorId: string;
  activeUserId: string | null;
  activeProfessionalId: string | null;
  activeOperatorLabel: string;
  activeOperatorRole: string;
  activeOperatorIsVeterinarian: boolean;
  activeOperatorFnoviNumber: string | null;
  activeOperatorFnoviProvince: string | null;
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
        active_clinic_operator_id: params.clinicOperatorId,
        active_user_id: params.activeUserId,
        active_professional_id: params.activeProfessionalId,
        active_operator_label: params.activeOperatorLabel,
        active_operator_role: params.activeOperatorRole,
        active_operator_is_veterinarian: params.activeOperatorIsVeterinarian,
        active_operator_fnovi_number: params.activeOperatorFnoviNumber,
        active_operator_fnovi_province: params.activeOperatorFnoviProvince,
        signature_mode: "operator_session_pin",
        pin_verified_at: nowIso,
        last_seen_at: nowIso,
        expires_at: expiresAt,
      },
      { onConflict: "organization_id,workstation_key" }
    )
    .select(
      "id, organization_id, workstation_key, active_user_id, active_professional_id, active_operator_label, pin_verified_at, last_seen_at, expires_at, created_at, updated_at, active_clinic_operator_id, active_operator_role, active_operator_is_veterinarian, active_operator_fnovi_number, active_operator_fnovi_province, signature_mode"
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
      "id, organization_id, workstation_key, active_user_id, active_professional_id, active_operator_label, pin_verified_at, last_seen_at, expires_at, created_at, updated_at, active_clinic_operator_id, active_operator_role, active_operator_is_veterinarian, active_operator_fnovi_number, active_operator_fnovi_province, signature_mode"
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