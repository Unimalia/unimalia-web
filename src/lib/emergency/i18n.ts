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
      "Vista emergenziale di accesso rapido per veterinari, soccorritori e persone che trovano lâ€™animale.",
    accessDetectedTitle: "Accesso rilevato",
    accessDetectedText:
      "Hai aperto il QR da una sessione autenticata UNIMALIA.",
    accessDetectedText2:
      "Nel prossimo step collegheremo qui il flusso completo basato sui permessi reali. Per ora la vista emergenza pubblica Ã¨ riservata allâ€™accesso anonimo.",
    animalLabel: "Animale",
    freeBasic: "Free Â· Basic",
    premiumAdvanced: "Premium Â· Advanced",
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
      "UNIMALIA Â· La vista pubblica non sostituisce la cartella clinica completa.",
    loading: "Caricamentoâ€¦",
    unavailable: "Scheda non disponibile.",
    home: "â† Home",
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
    freeBasic: "Free Â· Basic",
    premiumAdvanced: "Premium Â· Advanced",
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
      "UNIMALIA Â· This public view does not replace the complete medical record.",
    loading: "Loadingâ€¦",
    unavailable: "Record not available.",
    home: "â† Home",
  },
  fr: {
    emergencyTitle: "Vue vÃ©tÃ©rinaire dâ€™urgence",
    emergencySubtitle:
      "Vue dâ€™accÃ¨s rapide pour vÃ©tÃ©rinaires, secouristes et personnes qui trouvent lâ€™animal.",
    accessDetectedTitle: "AccÃ¨s authentifiÃ© dÃ©tectÃ©",
    accessDetectedText:
      "Vous avez ouvert ce QR depuis une session UNIMALIA authentifiÃ©e.",
    accessDetectedText2:
      "Ã€ lâ€™Ã©tape suivante, cette page suivra le flux rÃ©el des autorisations. Pour le moment, la vue dâ€™urgence publique est rÃ©servÃ©e Ã  lâ€™accÃ¨s anonyme.",
    animalLabel: "Animal",
    freeBasic: "Free Â· Basic",
    premiumAdvanced: "Premium Â· Advanced",
    animalName: "Nom de lâ€™animal",
    species: "EspÃ¨ce",
    weightKg: "Poids (kg)",
    allergies: "Allergies",
    activeTherapies: "Traitements en cours",
    chronicConditions: "Pathologies chroniques essentielles",
    emergencyContact: "Contact dâ€™urgence",
    contactName: "Nom",
    phone: "TÃ©lÃ©phone",
    vaccinationStatus: "Statut vaccinal",
    advancedSummary: "RÃ©sumÃ© de santÃ©",
    lastVisit: "DerniÃ¨re visite",
    lastVaccination: "DerniÃ¨re vaccination",
    footer:
      "UNIMALIA Â· Cette vue publique ne remplace pas le dossier clinique complet.",
    loading: "Chargementâ€¦",
    unavailable: "Fiche non disponible.",
    home: "â† Home",
  },
  de: {
    emergencyTitle: "VeterinÃ¤r-Notfallansicht",
    emergencySubtitle:
      "Schnellzugriff fÃ¼r TierÃ¤rzte, Helfer und Personen, die das Tier finden.",
    accessDetectedTitle: "Authentifizierter Zugriff erkannt",
    accessDetectedText:
      "Sie haben diesen QR aus einer authentifizierten UNIMALIA-Sitzung geÃ¶ffnet.",
    accessDetectedText2:
      "Im nÃ¤chsten Schritt wird diese Seite dem echten Berechtigungsfluss folgen. Im Moment ist die Ã¶ffentliche Notfallansicht nur fÃ¼r anonymen Zugriff vorgesehen.",
    animalLabel: "Tier",
    freeBasic: "Free Â· Basic",
    premiumAdvanced: "Premium Â· Advanced",
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
    advancedSummary: "Kurze GesundheitsÃ¼bersicht",
    lastVisit: "Letzter Besuch",
    lastVaccination: "Letzte Impfung",
    footer:
      "UNIMALIA Â· Diese Ã¶ffentliche Ansicht ersetzt nicht die vollstÃ¤ndige Krankenakte.",
    loading: "Ladenâ€¦",
    unavailable: "Datensatz nicht verfÃ¼gbar.",
    home: "â† Home",
  },
  es: {
    emergencyTitle: "Vista veterinaria de emergencia",
    emergencySubtitle:
      "Vista de acceso rÃ¡pido para veterinarios, rescatistas y personas que encuentran al animal.",
    accessDetectedTitle: "Acceso autenticado detectado",
    accessDetectedText:
      "Has abierto este QR desde una sesiÃ³n autenticada de UNIMALIA.",
    accessDetectedText2:
      "En el siguiente paso esta pÃ¡gina seguirÃ¡ el flujo real de permisos. Por ahora, la vista pÃºblica de emergencia estÃ¡ reservada al acceso anÃ³nimo.",
    animalLabel: "Animal",
    freeBasic: "Free Â· Basic",
    premiumAdvanced: "Premium Â· Advanced",
    animalName: "Nombre del animal",
    species: "Especie",
    weightKg: "Peso (kg)",
    allergies: "Alergias",
    activeTherapies: "Terapias activas",
    chronicConditions: "PatologÃ­as crÃ³nicas esenciales",
    emergencyContact: "Contacto de emergencia",
    contactName: "Nombre",
    phone: "TelÃ©fono",
    vaccinationStatus: "Estado vacunal",
    advancedSummary: "Resumen sanitario breve",
    lastVisit: "Ãšltima visita",
    lastVaccination: "Ãšltima vacunaciÃ³n",
    footer:
      "UNIMALIA Â· Esta vista pÃºblica no sustituye la historia clÃ­nica completa.",
    loading: "Cargandoâ€¦",
    unavailable: "Ficha no disponible.",
    home: "â† Home",
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
