export type EmergencyLang = "it" | "en";

export function detectLang(): EmergencyLang {
  if (typeof navigator === "undefined") return "en";

  const lang = navigator.language.toLowerCase();

  if (lang.startsWith("it")) return "it";
  return "en";
}

export const DICT = {
  it: {
    title: "Informazioni di emergenza",
    subtitle:
      "Questa vista pubblica non sostituisce la cartella clinica completa.",
    allergies: "Allergie",
    therapies: "Terapie attive",
    chronic: "Patologie croniche",
    blood: "Gruppo sanguigno",
    sterilized: "Sterilizzato / castrato",
    notAvailable: "Non rilevato",
  },
  en: {
    title: "Emergency information",
    subtitle:
      "This public view does not replace the full medical record.",
    allergies: "Allergies",
    therapies: "Active therapies",
    chronic: "Chronic conditions",
    blood: "Blood type",
    sterilized: "Sterilized / neutered",
    notAvailable: "Not available",
  },
};