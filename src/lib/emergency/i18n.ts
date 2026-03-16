export type EmergencyLocale = "it" | "en" | "fr" | "de" | "es";

type Dict = {
  emergencyTitle: string;
  emergencySubtitle: string;
  accessDetectedTitle: string;
  accessDetectedText: string;
  accessDetectedText2: string;
  animalLabel: string;
  freeBasic: string;
  premiumAdvanced: string;
  animalName: string;
  species: string;
  weightKg: string;
  allergies: string;
  activeTherapies: string;
  chronicConditions: string;
  emergencyContact: string;
  contactName: string;
  phone: string;
  vaccinationStatus: string;
  advancedSummary: string;
  lastVisit: string;
  lastVaccination: string;
  footer: string;
  loading: string;
  unavailable: string;
  home: string;
};

export const emergencyDict: Record<EmergencyLocale, Dict> = {
  it: {
    emergencyTitle: "Emergency Veterinary View",
    emergencySubtitle:
      "Vista emergenziale di accesso rapido per veterinari, soccorritori e persone che trovano l’animale.",
    accessDetectedTitle: "Accesso rilevato",
    accessDetectedText:
      "Hai aperto il QR da una sessione autenticata UNIMALIA.",
    accessDetectedText2:
      "Nel prossimo step collegheremo qui il flusso completo basato sui permessi reali. Per ora la vista emergenza pubblica è riservata all’accesso anonimo.",
    animalLabel: "Animale",
    freeBasic: "Free · Basic",
    premiumAdvanced: "Premium · Advanced",
    animalName: "Nome animale",
    species: "Specie",
    weightKg: "Peso (kg)",
    allergies: "Allergie",
    activeTherapies: "Terapie attive",
    chronicConditions: "Patologie croniche essenziali",
    emergencyContact: "Contatto emergenza",
    contactName: "Nome",
    phone: "Telefono",
    vaccinationStatus: "Stato vaccinale sintetico",
    advancedSummary: "Riepilogo sanitario breve",
    lastVisit: "Ultima visita",
    lastVaccination: "Ultima vaccinazione",
    footer:
      "UNIMALIA · La vista pubblica non sostituisce la cartella clinica completa.",
    loading: "Caricamento…",
    unavailable: "Scheda non disponibile.",
    home: "← Home",
  },
  en: {
    emergencyTitle: "Emergency Veterinary View",
    emergencySubtitle:
      "Rapid emergency access view for veterinarians, rescuers, and people who find the animal.",
    accessDetectedTitle: "Authenticated access detected",
    accessDetectedText:
      "You opened this QR from an authenticated UNIMALIA session.",
    accessDetectedText2:
      "In the next step this page will follow the real permissions flow. For now, the public emergency view is reserved for anonymous access.",
    animalLabel: "Animal",
    freeBasic: "Free · Basic",
    premiumAdvanced: "Premium · Advanced",
    animalName: "Animal name",
    species: "Species",
    weightKg: "Weight (kg)",
    allergies: "Allergies",
    activeTherapies: "Current therapies",
    chronicConditions: "Essential chronic conditions",
    emergencyContact: "Emergency contact",
    contactName: "Name",
    phone: "Phone",
    vaccinationStatus: "Vaccination status",
    advancedSummary: "Short health summary",
    lastVisit: "Last visit",
    lastVaccination: "Last vaccination",
    footer:
      "UNIMALIA · This public view does not replace the complete medical record.",
    loading: "Loading…",
    unavailable: "Record not available.",
    home: "← Home",
  },
  fr: {
    emergencyTitle: "Vue vétérinaire d’urgence",
    emergencySubtitle:
      "Vue d’accès rapide pour vétérinaires, secouristes et personnes qui trouvent l’animal.",
    accessDetectedTitle: "Accès authentifié détecté",
    accessDetectedText:
      "Vous avez ouvert ce QR depuis une session UNIMALIA authentifiée.",
    accessDetectedText2:
      "À l’étape suivante, cette page suivra le flux réel des autorisations. Pour le moment, la vue d’urgence publique est réservée à l’accès anonyme.",
    animalLabel: "Animal",
    freeBasic: "Free · Basic",
    premiumAdvanced: "Premium · Advanced",
    animalName: "Nom de l’animal",
    species: "Espèce",
    weightKg: "Poids (kg)",
    allergies: "Allergies",
    activeTherapies: "Traitements en cours",
    chronicConditions: "Pathologies chroniques essentielles",
    emergencyContact: "Contact d’urgence",
    contactName: "Nom",
    phone: "Téléphone",
    vaccinationStatus: "Statut vaccinal",
    advancedSummary: "Résumé de santé",
    lastVisit: "Dernière visite",
    lastVaccination: "Dernière vaccination",
    footer:
      "UNIMALIA · Cette vue publique ne remplace pas le dossier clinique complet.",
    loading: "Chargement…",
    unavailable: "Fiche non disponible.",
    home: "← Home",
  },
  de: {
    emergencyTitle: "Veterinär-Notfallansicht",
    emergencySubtitle:
      "Schnellzugriff für Tierärzte, Helfer und Personen, die das Tier finden.",
    accessDetectedTitle: "Authentifizierter Zugriff erkannt",
    accessDetectedText:
      "Sie haben diesen QR aus einer authentifizierten UNIMALIA-Sitzung geöffnet.",
    accessDetectedText2:
      "Im nächsten Schritt wird diese Seite dem echten Berechtigungsfluss folgen. Im Moment ist die öffentliche Notfallansicht nur für anonymen Zugriff vorgesehen.",
    animalLabel: "Tier",
    freeBasic: "Free · Basic",
    premiumAdvanced: "Premium · Advanced",
    animalName: "Tiername",
    species: "Art",
    weightKg: "Gewicht (kg)",
    allergies: "Allergien",
    activeTherapies: "Aktive Therapien",
    chronicConditions: "Wesentliche chronische Erkrankungen",
    emergencyContact: "Notfallkontakt",
    contactName: "Name",
    phone: "Telefon",
    vaccinationStatus: "Impfstatus",
    advancedSummary: "Kurze Gesundheitsübersicht",
    lastVisit: "Letzter Besuch",
    lastVaccination: "Letzte Impfung",
    footer:
      "UNIMALIA · Diese öffentliche Ansicht ersetzt nicht die vollständige Krankenakte.",
    loading: "Laden…",
    unavailable: "Datensatz nicht verfügbar.",
    home: "← Home",
  },
  es: {
    emergencyTitle: "Vista veterinaria de emergencia",
    emergencySubtitle:
      "Vista de acceso rápido para veterinarios, rescatistas y personas que encuentran al animal.",
    accessDetectedTitle: "Acceso autenticado detectado",
    accessDetectedText:
      "Has abierto este QR desde una sesión autenticada de UNIMALIA.",
    accessDetectedText2:
      "En el siguiente paso esta página seguirá el flujo real de permisos. Por ahora, la vista pública de emergencia está reservada al acceso anónimo.",
    animalLabel: "Animal",
    freeBasic: "Free · Basic",
    premiumAdvanced: "Premium · Advanced",
    animalName: "Nombre del animal",
    species: "Especie",
    weightKg: "Peso (kg)",
    allergies: "Alergias",
    activeTherapies: "Terapias activas",
    chronicConditions: "Patologías crónicas esenciales",
    emergencyContact: "Contacto de emergencia",
    contactName: "Nombre",
    phone: "Teléfono",
    vaccinationStatus: "Estado vacunal",
    advancedSummary: "Resumen sanitario breve",
    lastVisit: "Última visita",
    lastVaccination: "Última vacunación",
    footer:
      "UNIMALIA · Esta vista pública no sustituye la historia clínica completa.",
    loading: "Cargando…",
    unavailable: "Ficha no disponible.",
    home: "← Home",
  },
};

export function detectEmergencyLocale(
  browserLanguage: string | null | undefined,
  premiumEnabled: boolean
): EmergencyLocale {
  const lang = (browserLanguage ?? "").toLowerCase();

  if (!premiumEnabled) {
    return lang.startsWith("it") ? "it" : "en";
  }

  if (lang.startsWith("it")) return "it";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("es")) return "es";
  return "en";
}
