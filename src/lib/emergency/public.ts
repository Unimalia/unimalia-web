export type EmergencyPublicBase = {
  animalId: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
};

export type EmergencyProfilePublic = {
  enabled: boolean;
  animal_name: string | null;
  species: string | null;
  weight_kg: number | null;
  allergies: string | null;
  active_therapies: string | null;
  chronic_conditions: string | null;
  is_lost: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  show_emergency_contact: boolean;
  premium_enabled: boolean;
  essential_vaccination_status: string | null;
  advanced_summary: string | null;
  last_visit_summary: string | null;
  last_vaccination_summary: string | null;
};

export type EmergencyPublicPayload = {
  animal: EmergencyPublicBase;
  emergency: EmergencyProfilePublic | null;
  view: "basic" | "advanced";
};

export function getFallbackLocale(input: string | null | undefined) {
  if (!input) return "it";
  const normalized = input.toLowerCase();

  if (normalized.startsWith("it")) return "it";
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("es")) return "es";

  return "en";
}
