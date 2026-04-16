import {
  AgendaAppointment,
  AgendaSettings,
  VetScheduleOverride,
  WeeklyShift,
  VetSchedule,
} from "@/lib/agenda/types";

export const AGENDA_SETTINGS_KEY = "unimalia_agenda_settings_v2";
export const AGENDA_OVERRIDES_KEY = "unimalia_agenda_overrides_v2";
export const AGENDA_APPOINTMENTS_KEY = "unimalia_agenda_appointments_v2";

function createShift(enabled = false): WeeklyShift {
  return {
    enabled,
    start: "09:00",
    end: "18:00",
    breakStart: "13:00",
    breakEnd: "14:00",
  };
}

function createSchedule(): VetSchedule {
  return {
    monday: createShift(true),
    tuesday: createShift(true),
    wednesday: createShift(true),
    thursday: createShift(true),
    friday: createShift(true),
    saturday: createShift(false),
    sunday: createShift(false),
  };
}

export function createDefaultAgendaSettings(): AgendaSettings {
  return {
    clinicName: "Clinica UNIMALIA",
    slotMinutes: 30,
    vets: [
      {
        id: crypto.randomUUID(),
        name: "Dott.ssa Rossi",
        schedule: createSchedule(),
      },
      {
        id: crypto.randomUUID(),
        name: "Dott. Bianchi",
        schedule: {
          monday: { enabled: true, start: "10:00", end: "19:00", breakStart: "14:00", breakEnd: "15:00" },
          tuesday: { enabled: true, start: "10:00", end: "19:00", breakStart: "14:00", breakEnd: "15:00" },
          wednesday: { enabled: true, start: "10:00", end: "19:00", breakStart: "14:00", breakEnd: "15:00" },
          thursday: { enabled: true, start: "10:00", end: "19:00", breakStart: "14:00", breakEnd: "15:00" },
          friday: { enabled: true, start: "10:00", end: "19:00", breakStart: "14:00", breakEnd: "15:00" },
          saturday: { enabled: false, start: "00:00", end: "00:00", breakStart: "00:00", breakEnd: "00:00" },
          sunday: { enabled: false, start: "00:00", end: "00:00", breakStart: "00:00", breakEnd: "00:00" },
        },
      },
    ],
    rooms: [
      { id: crypto.randomUUID(), name: "Visita 1" },
      { id: crypto.randomUUID(), name: "Visita 2" },
    ],
    visitTypes: [
      { id: "visit", label: "Visita clinica", duration: 30 },
      { id: "vaccine", label: "Vaccino", duration: 15 },
      { id: "follow_up", label: "Ricontrollo", duration: 20 },
      { id: "therapy", label: "Terapia", duration: 60 },
    ],
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadAgendaSettings(): AgendaSettings {
  if (!canUseStorage()) return createDefaultAgendaSettings();

  const raw = window.localStorage.getItem(AGENDA_SETTINGS_KEY);
  if (!raw) {
    const fallback = createDefaultAgendaSettings();
    saveAgendaSettings(fallback);
    return fallback;
  }

  try {
    return JSON.parse(raw) as AgendaSettings;
  } catch {
    const fallback = createDefaultAgendaSettings();
    saveAgendaSettings(fallback);
    return fallback;
  }
}

export function saveAgendaSettings(settings: AgendaSettings) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AGENDA_SETTINGS_KEY, JSON.stringify(settings));
}

export function loadAgendaOverrides(): VetScheduleOverride[] {
  if (!canUseStorage()) return [];

  const raw = window.localStorage.getItem(AGENDA_OVERRIDES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAgendaOverrides(items: VetScheduleOverride[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AGENDA_OVERRIDES_KEY, JSON.stringify(items));
}

export function loadAgendaAppointments(): AgendaAppointment[] {
  if (!canUseStorage()) return [];

  const raw = window.localStorage.getItem(AGENDA_APPOINTMENTS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAgendaAppointments(items: AgendaAppointment[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AGENDA_APPOINTMENTS_KEY, JSON.stringify(items));
}
