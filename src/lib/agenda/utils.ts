import {
  AgendaAppointment,
  Vet,
  VetSchedule,
  VetScheduleOverride,
  WeeklyShift,
} from "@/lib/agenda/types";

export const DAY_LABELS: { key: keyof VetSchedule; label: string }[] = [
  { key: "monday", label: "LunedÃ¬" },
  { key: "tuesday", label: "MartedÃ¬" },
  { key: "wednesday", label: "MercoledÃ¬" },
  { key: "thursday", label: "GiovedÃ¬" },
  { key: "friday", label: "VenerdÃ¬" },
  { key: "saturday", label: "Sabato" },
  { key: "sunday", label: "Domenica" },
];

export function pad(num: number) {
  return num.toString().padStart(2, "0");
}

export function todayIsoLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(date: string, days: number) {
  const ref = new Date(`${date}T12:00:00`);
  ref.setDate(ref.getDate() + days);
  return `${ref.getFullYear()}-${pad(ref.getMonth() + 1)}-${pad(ref.getDate())}`;
}

export function formatDateLabel(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad(h)}:${pad(m)}`;
}

export function getDayKeyFromDate(date: string): keyof VetSchedule {
  const index = new Date(`${date}T12:00:00`).getDay();

  switch (index) {
    case 1:
      return "monday";
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    case 6:
      return "saturday";
    default:
      return "sunday";
  }
}

export function generateSlots(start: string, end: string, slotMinutes: number) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const rows: string[] = [];

  for (let cursor = startMinutes; cursor < endMinutes; cursor += slotMinutes) {
    rows.push(minutesToTime(cursor));
  }

  return rows;
}

export function resolveVetShift(
  vet: Vet,
  date: string,
  overrides: VetScheduleOverride[]
): WeeklyShift {
  const directOverride = overrides.find((item) => item.vetId === vet.id && item.date === date);

  if (directOverride) {
    return {
      enabled: directOverride.enabled,
      start: directOverride.start,
      end: directOverride.end,
      breakStart: directOverride.breakStart,
      breakEnd: directOverride.breakEnd,
    };
  }

  const dayKey = getDayKeyFromDate(date);
  return vet.schedule[dayKey];
}

export function isSlotInBreak(time: string, shift: WeeklyShift) {
  if (!shift.enabled) return false;

  const current = timeToMinutes(time);
  const breakStart = timeToMinutes(shift.breakStart);
  const breakEnd = timeToMinutes(shift.breakEnd);

  if (shift.breakStart === "00:00" && shift.breakEnd === "00:00") return false;
  return current >= breakStart && current < breakEnd;
}

export function getEndTimeFromDuration(startTime: string, duration: number) {
  return minutesToTime(timeToMinutes(startTime) + duration);
}

export function doesIntervalOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  // Intervalli [start, end)
  // 09:00-09:30 NON si sovrappone a 09:30-10:00
  return aStart < bEnd && bStart < aEnd;
}

export function appointmentCoversSlot(appointment: AgendaAppointment, slotTime: string) {
  const slot = timeToMinutes(slotTime);
  return slot >= timeToMinutes(appointment.startTime) && slot < timeToMinutes(appointment.endTime);
}

export function appointmentStartsAtSlot(appointment: AgendaAppointment, slotTime: string) {
  return appointment.startTime === slotTime;
}

export function appointmentIsActive(appointment: AgendaAppointment) {
  return appointment.status !== "cancelled";
}

export function getWeekDates(anchorDate: string) {
  const ref = new Date(`${anchorDate}T12:00:00`);
  const day = ref.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + mondayOffset);

  const dates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }

  return dates;
}
