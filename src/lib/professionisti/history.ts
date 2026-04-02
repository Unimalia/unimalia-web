export const HISTORY_AUTHOR_TYPES = ["owner", "professional"] as const;
export type HistoryAuthorType = (typeof HISTORY_AUTHOR_TYPES)[number];

export const HISTORY_SOURCE_SCOPES = [
  "owner_note",
  "owner_reminder",
  "professional_service",
  "professional_note",
  "clinical_reminder",
] as const;
export type HistorySourceScope = (typeof HISTORY_SOURCE_SCOPES)[number];

export const HISTORY_CATEGORIES = [
  "owner",
  "addestramento",
  "toelettatura",
  "pensione",
  "pet_sitter",
  "pet_detective",
  "altro",
  "clinica",
] as const;
export type HistoryCategory = (typeof HISTORY_CATEGORIES)[number];

export const PROFESSIONAL_HISTORY_CATEGORIES = [
  "addestramento",
  "toelettatura",
  "pensione",
  "pet_sitter",
  "pet_detective",
  "altro",
] as const;
export type ProfessionalHistoryCategory = (typeof PROFESSIONAL_HISTORY_CATEGORIES)[number];

export const HISTORY_STATUSES = ["planned", "completed", "cancelled"] as const;
export type HistoryStatus = (typeof HISTORY_STATUSES)[number];

export const HISTORY_VISIBILITIES = ["owner", "professionals", "shared"] as const;
export type HistoryVisibility = (typeof HISTORY_VISIBILITIES)[number];

export type AnimalHistoryEventRow = {
  id: string;
  animal_id: string;
  author_type: HistoryAuthorType;
  author_user_id: string;
  author_name_snapshot: string | null;
  professional_organization_id: string | null;
  professional_category: string | null;
  source_scope: HistorySourceScope;
  category: HistoryCategory;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  next_action_date: string | null;
  status: HistoryStatus;
  visibility: HistoryVisibility;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProfessionalHistoryCreateInput = {
  animalId: string;
  sourceScope: "professional_service" | "professional_note";
  category: ProfessionalHistoryCategory;
  eventType: string;
  title: string;
  description: string | null;
  eventDate: string;
  nextActionDate: string | null;
  status: HistoryStatus;
  visibility: "shared" | "professionals";
  meta: Record<string, unknown>;
};

export const historyCategoryLabels: Record<HistoryCategory, string> = {
  owner: "Owner",
  addestramento: "Addestramento",
  toelettatura: "Toelettatura",
  pensione: "Pensione",
  pet_sitter: "Pet sitter",
  pet_detective: "Pet detective",
  altro: "Altro",
  clinica: "Clinica",
};

export const historyStatusLabels: Record<HistoryStatus, string> = {
  planned: "Programmato",
  completed: "Completato",
  cancelled: "Annullato",
};

export const historyVisibilityLabels: Record<HistoryVisibility, string> = {
  owner: "Solo owner",
  professionals: "Solo professionisti",
  shared: "Condiviso",
};

export const historySourceScopeLabels: Record<HistorySourceScope, string> = {
  owner_note: "Nota owner",
  owner_reminder: "Promemoria owner",
  professional_service: "Servizio professionista",
  professional_note: "Nota professionista",
  clinical_reminder: "Promemoria clinico",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInArray<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return allowed.includes(value);
}

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function cleanOptionalString(value: unknown): string | null {
  const normalized = cleanString(value);
  return normalized.length ? normalized : null;
}

function normalizeDateTime(value: unknown, fieldLabel: string): string {
  const raw = cleanString(value);
  if (!raw) {
    throw new Error(`${fieldLabel} obbligatorio`);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldLabel} non valido`);
  }

  return parsed.toISOString();
}

function normalizeOptionalDateTime(value: unknown): string | null {
  const raw = cleanString(value);
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Data promemoria non valida");
  }

  return parsed.toISOString();
}

export function parseProfessionalHistoryCreateInput(raw: unknown): ProfessionalHistoryCreateInput {
  if (!isObject(raw)) {
    throw new Error("Body non valido");
  }

  const animalId = cleanString(raw.animalId);
  const sourceScope = cleanString(raw.sourceScope);
  const category = cleanString(raw.category);
  const eventType = cleanString(raw.eventType);
  const title = cleanString(raw.title);
  const description = cleanOptionalString(raw.description);
  const eventDate = normalizeDateTime(raw.eventDate, "Data evento");
  const nextActionDate = normalizeOptionalDateTime(raw.nextActionDate);
  const status = cleanString(raw.status) || "completed";
  const visibility = cleanString(raw.visibility) || "shared";

  if (!animalId) {
    throw new Error("animalId obbligatorio");
  }

  if (!isInArray(sourceScope, ["professional_service", "professional_note"] as const)) {
    throw new Error("sourceScope non valido");
  }

  if (!isInArray(category, PROFESSIONAL_HISTORY_CATEGORIES)) {
    throw new Error("Categoria non valida");
  }

  if (!eventType) {
    throw new Error("Tipo evento obbligatorio");
  }

  if (!title) {
    throw new Error("Titolo obbligatorio");
  }

  if (!isInArray(status, HISTORY_STATUSES)) {
    throw new Error("Stato non valido");
  }

  if (!isInArray(visibility, ["shared", "professionals"] as const)) {
    throw new Error("Visibilità non valida");
  }

  const meta = isObject(raw.meta) ? raw.meta : {};

  return {
    animalId,
    sourceScope,
    category,
    eventType,
    title,
    description,
    eventDate,
    nextActionDate,
    status,
    visibility,
    meta,
  };
}

export function formatHistoryDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toLocalDatetimeInputValue(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}