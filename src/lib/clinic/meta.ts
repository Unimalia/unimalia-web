type ClinicMetaLike = {
  weight_kg?: number | string | null;
  weightKg?: number | string | null;
  therapy_start_date?: string | null;
  therapy_end_date?: string | null;
  created_by_member_label?: string | null;
  priority?: string | null;
  diagnosis?: string | null;
  diagnosis_date?: string | null;
  follow_up_type?: string | null;
  scheduled_date?: string | null;
  vaccine_type?: string | null;
  next_due_date?: string | null;
  batch_number?: string | null;
};

type ClinicEventLike = {
  type?: string | null;
  weight_kg?: number | string | null;
  weightKg?: number | string | null;
  priority?: string | null;
  meta?: ClinicMetaLike | null;
  data?: {
    weightKg?: number | string | null;
    weight_kg?: number | string | null;
  } | null;
  payload?: {
    weightKg?: number | string | null;
    weight_kg?: number | string | null;
  } | null;
};

export function extractWeightKg(e: ClinicEventLike | null | undefined): number | null {
  if (!e) return null;

  const direct =
    e.weight_kg ??
    e.weightKg ??
    e.meta?.weight_kg ??
    e.meta?.weightKg ??
    e.data?.weightKg ??
    e.data?.weight_kg ??
    e.payload?.weightKg ??
    e.payload?.weight_kg;

  if (direct === null || direct === undefined) return null;

  const n = typeof direct === "number" ? direct : Number(String(direct).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;

  return Math.round(n * 10) / 10;
}

export function extractTherapyStartDate(e: ClinicEventLike | null | undefined): string | null {
  return e?.meta?.therapy_start_date || null;
}

export function extractTherapyEndDate(e: ClinicEventLike | null | undefined): string | null {
  return e?.meta?.therapy_end_date || null;
}

export function isTherapyActive(e: ClinicEventLike | null | undefined): boolean {
  if (!e || e.type !== "therapy") return false;

  const start = extractTherapyStartDate(e);
  const end = extractTherapyEndDate(e);
  if (!start) return false;

  const today = new Date();
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (!end) return true;
  return end >= ymd;
}

export function extractCreatedByMemberLabel(e: ClinicEventLike | null | undefined): string | null {
  return e?.meta?.created_by_member_label || null;
}

export function extractPriority(e: ClinicEventLike | null | undefined): string | null {
  return e?.priority || e?.meta?.priority || null;
}

export function extractChronicDiagnosis(e: ClinicEventLike | null | undefined): string | null {
  return e?.meta?.diagnosis || null;
}

export function extractChronicDiagnosisDate(e: ClinicEventLike | null | undefined): string | null {
  return e?.meta?.diagnosis_date || null;
}

export function extractFollowUpType(e: ClinicEventLike | null | undefined): string | null {
  return e?.meta?.follow_up_type || null;
}

export function extractFollowUpDate(e: ClinicEventLike | null | undefined): string | null {
  return e?.meta?.scheduled_date || null;
}

export function extractVaccineType(e: ClinicEventLike | null | undefined): string | null {
  return e?.meta?.vaccine_type || null;
}

export function extractNextDueDate(e: ClinicEventLike | null | undefined): string | null {
  return e?.meta?.next_due_date || null;
}

export function extractBatchNumber(e: ClinicEventLike | null | undefined): string | null {
  return e?.meta?.batch_number || null;
}