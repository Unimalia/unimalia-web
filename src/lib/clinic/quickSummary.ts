import {
  extractNextDueDate,
  extractWeightKg,
  isTherapyActive,
} from "@/lib/clinic/meta";

export type ClinicalQuickSummary = {
  age: string;
  weight: string;
  bloodType: string;
  sterilizationStatus: string;
  allergies: string[];
  activeTherapies: string[];
  lastTherapies: string[];
  chronicPathologies: string[];
  nextRecall: string | null;
  latestVisit: string | null;
  latestVaccination: string | null;
  vaccinationExpiry: string | null;
};

type QuickSummaryAnimal = {
  birth_date?: string | null;
  sterilized?: boolean | null;
};

type QuickSummaryEvent = {
  id?: string;
  type?: string | null;
  title?: string | null;
  description?: string | null;
  event_date?: string | null;
  created_at?: string | null;
  meta?: Record<string, unknown> | null;
  status?: string | null;
};

function formatDateIT(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("it-IT");
}

function formatAgeFromBirthDate(birthDate?: string | null): string {
  if (!birthDate) return "—";

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return "—";

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) {
    return years === 1 ? "1 anno" : `${years} anni`;
  }

  if (months > 0) {
    return months === 1 ? "1 mese" : `${months} mesi`;
  }

  return "—";
}

function sortByEventDateDesc<T extends QuickSummaryEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const da = new Date(a.event_date || a.created_at || 0).getTime();
    const db = new Date(b.event_date || b.created_at || 0).getTime();
    return db - da;
  });
}

function sortByEventDateAsc<T extends QuickSummaryEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const da = new Date(a.event_date || a.created_at || 0).getTime();
    const db = new Date(b.event_date || b.created_at || 0).getTime();
    return da - db;
  });
}

function eventMainText(e: QuickSummaryEvent): string {
  return String(e.description || e.title || "").trim();
}

function extractBloodType(e: QuickSummaryEvent): string | null {
  const meta = (e.meta ?? {}) as Record<string, unknown>;

  const value =
    meta.blood_type ??
    meta.bloodType ??
    meta.group_blood ??
    meta.groupBlood ??
    (e.type === "blood_type" ? e.description ?? e.title ?? null : null);

  const text = String(value ?? "").trim();
  return text || null;
}

function formatWeight(value: number | null): string {
  if (value === null) return "—";
  return Number.isInteger(value) ? `${value} kg` : `${value} kg`;
}

function formatSterilizationStatus(value?: boolean | null): string {
  if (value === true) return "Sì";
  if (value === false) return "No";
  return "—";
}

export function buildClinicalQuickSummary(input: {
  animal?: QuickSummaryAnimal | null;
  events?: QuickSummaryEvent[] | null;
}): ClinicalQuickSummary {
  const animal = input.animal ?? null;
  const events = (input.events ?? []).filter((e) => e && e.status !== "void");

  const eventsByDateDesc = sortByEventDateDesc(events);
  const visits = eventsByDateDesc.filter((e) => e.type === "visit");
  const vaccines = eventsByDateDesc.filter((e) => e.type === "vaccine");
  const allergies = eventsByDateDesc.filter((e) => e.type === "allergy").slice(0, 3);
  const chronicConditions = eventsByDateDesc
    .filter((e) => e.type === "chronic_condition")
    .slice(0, 3);

  const activeTherapies = eventsByDateDesc
    .filter((e) => e.type === "therapy" && isTherapyActive(e))
    .slice(0, 3);

  const lastTherapies = eventsByDateDesc
    .filter((e) => e.type === "therapy" && !isTherapyActive(e))
    .slice(0, 3);

  const nextRecallEvent =
    sortByEventDateAsc(
      events.filter((e) => e.type === "follow_up" && e.event_date)
    )[0] ?? null;

  const lastWeightEntry =
    eventsByDateDesc
      .map((e) => ({
        event: e,
        weight: extractWeightKg(e),
      }))
      .find((x) => x.weight !== null) ?? null;

  const latestVisit = visits[0] ?? null;
  const latestVaccination = vaccines[0] ?? null;

  const latestBloodType =
    eventsByDateDesc
      .map((e) => extractBloodType(e))
      .find(Boolean) ?? null;

  const vaccinationExpiry =
    latestVaccination ? extractNextDueDate(latestVaccination) : null;

  return {
    age: formatAgeFromBirthDate(animal?.birth_date),
    weight: lastWeightEntry
      ? `${formatWeight(lastWeightEntry.weight)} • ${formatDateIT(lastWeightEntry.event.event_date) || "—"}`
      : "—",
    bloodType: latestBloodType || "Non rilevato",
    sterilizationStatus: formatSterilizationStatus(animal?.sterilized),
    allergies: allergies
      .map((e) => {
        const text = eventMainText(e) || "Allergia";
        const date = formatDateIT(e.event_date);
        return date ? `${text} • ${date}` : text;
      })
      .slice(0, 3),
    activeTherapies: activeTherapies
      .map((e) => eventMainText(e) || "Terapia")
      .slice(0, 3),
    lastTherapies: lastTherapies
      .map((e) => {
        const text = eventMainText(e) || "Terapia";
        const date = formatDateIT(e.event_date);
        return date ? `${text} • ${date}` : text;
      })
      .slice(0, 3),
    chronicPathologies: chronicConditions
      .map((e) => {
        const text = eventMainText(e) || "Patologia cronica";
        const date = formatDateIT(e.event_date);
        return date ? `${text} • ${date}` : text;
      })
      .slice(0, 3),
    nextRecall: nextRecallEvent ? formatDateIT(nextRecallEvent.event_date) : null,
    latestVisit: latestVisit ? formatDateIT(latestVisit.event_date) : null,
    latestVaccination: latestVaccination ? formatDateIT(latestVaccination.event_date) : null,
    vaccinationExpiry: vaccinationExpiry ? formatDateIT(vaccinationExpiry) : null,
  };
}