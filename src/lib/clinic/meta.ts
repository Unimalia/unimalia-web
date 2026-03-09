export function extractWeightKg(e: any): number | null {
  if (!e) return null;

  const direct =
    e.weight_kg ??
    e.weightKg ??
    e?.meta?.weight_kg ??
    e?.meta?.weightKg ??
    e?.data?.weightKg ??
    e?.data?.weight_kg ??
    e?.payload?.weightKg ??
    e?.payload?.weight_kg;

  if (direct === null || direct === undefined) return null;

  const n = typeof direct === "number" ? direct : Number(String(direct).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;

  return Math.round(n * 10) / 10;
}

export function extractTherapyStartDate(e: any): string | null {
  return e?.meta?.therapy_start_date || null;
}

export function extractTherapyEndDate(e: any): string | null {
  return e?.meta?.therapy_end_date || null;
}

export function isTherapyActive(e: any) {
  if (!e || e.type !== "therapy") return false;

  const start = extractTherapyStartDate(e);
  const end = extractTherapyEndDate(e);
  if (!start) return false;

  const today = new Date();
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (!end) return true;
  return end >= ymd;
}

export function extractCreatedByMemberLabel(e: any): string | null {
  return e?.meta?.created_by_member_label || null;
}

export function extractPriority(e: any): string | null {
  return e?.priority || e?.meta?.priority || null;
}

export function extractChronicDiagnosis(e: any): string | null {
  return e?.meta?.diagnosis || null;
}

export function extractChronicDiagnosisDate(e: any): string | null {
  return e?.meta?.diagnosis_date || null;
}

export function extractFollowUpType(e: any): string | null {
  return e?.meta?.follow_up_type || null;
}

export function extractFollowUpDate(e: any): string | null {
  return e?.meta?.scheduled_date || null;
}