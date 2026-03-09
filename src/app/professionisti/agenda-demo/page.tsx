"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type VisitType = {
  id: string;
  label: string;
  duration: number;
};

type WeeklyShift = {
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};

type VetSchedule = {
  monday: WeeklyShift;
  tuesday: WeeklyShift;
  wednesday: WeeklyShift;
  thursday: WeeklyShift;
  friday: WeeklyShift;
  saturday: WeeklyShift;
  sunday: WeeklyShift;
};

type Vet = {
  id: string;
  name: string;
  schedule: VetSchedule;
};

type Room = {
  id: string;
  name: string;
};

type Animal = {
  id: string;
  name: string;
  species: "Cane" | "Gatto";
  breed: string;
  ownerName: string;
  code: string;
};

type AgendaSettings = {
  clinicName: string;
  startHour: string;
  endHour: string;
  breakStart: string;
  breakEnd: string;
  slotMinutes: number;
  vets: Vet[];
  rooms: Room[];
  visitTypes: VisitType[];
};

type DemoAppointment = {
  id: string;
  date: string;
  time: string;
  vetId: string;
  roomId: string;
  animalId: string;
  animalName: string;
  ownerName: string;
  visitTypeId: string;
  visitTypeLabel: string;
  duration: number;
  notes: string;
  createdAt: string;
};

type SlotRow = {
  time: string;
  isBreak: boolean;
  vetId: string;
  roomId: string;
  appointment?: DemoAppointment;
};

const SETTINGS_KEYS = [
  "unimalia_agenda_settings",
  "unimalia-agenda-settings",
  "agenda_settings_demo",
  "agendaSettings",
  "unimaliaAgendaSettings",
];

const APPOINTMENTS_KEY = "unimalia_agenda_demo_appointments";

const DEFAULT_SETTINGS: AgendaSettings = {
  clinicName: "Clinica UNIMALIA Demo",
  startHour: "09:00",
  endHour: "18:00",
  breakStart: "13:00",
  breakEnd: "14:00",
  slotMinutes: 30,
  vets: [
    {
      id: "vet-1",
      name: "Dott.ssa Rossi",
      schedule: {
        monday: { enabled: true, start: "09:00", end: "18:00", breakStart: "13:00", breakEnd: "14:00" },
        tuesday: { enabled: true, start: "09:00", end: "18:00", breakStart: "13:00", breakEnd: "14:00" },
        wednesday: { enabled: true, start: "09:00", end: "18:00", breakStart: "13:00", breakEnd: "14:00" },
        thursday: { enabled: true, start: "09:00", end: "18:00", breakStart: "13:00", breakEnd: "14:00" },
        friday: { enabled: true, start: "09:00", end: "18:00", breakStart: "13:00", breakEnd: "14:00" },
        saturday: { enabled: false, start: "09:00", end: "13:00", breakStart: "00:00", breakEnd: "00:00" },
        sunday: { enabled: false, start: "00:00", end: "00:00", breakStart: "00:00", breakEnd: "00:00" },
      },
    },
    {
      id: "vet-2",
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
    { id: "room-1", name: "Visita 1" },
    { id: "room-2", name: "Visita 2" },
  ],
  visitTypes: [
    { id: "visit", label: "Visita clinica", duration: 30 },
    { id: "vaccine", label: "Vaccino", duration: 15 },
    { id: "follow_up", label: "Ricontrollo", duration: 20 },
    { id: "therapy", label: "Terapia", duration: 30 },
  ],
};

const DEMO_ANIMALS: Animal[] = [
  {
    id: "animal-demo-1",
    name: "Luna",
    species: "Cane",
    breed: "Labrador",
    ownerName: "Marco Rossi",
    code: "UNI-001",
  },
  {
    id: "animal-demo-2",
    name: "Milo",
    species: "Gatto",
    breed: "Europeo",
    ownerName: "Giulia Bianchi",
    code: "UNI-002",
  },
  {
    id: "animal-demo-3",
    name: "Nala",
    species: "Cane",
    breed: "Border Collie",
    ownerName: "Francesca Verdi",
    code: "UNI-003",
  },
  {
    id: "animal-demo-4",
    name: "Leo",
    species: "Gatto",
    breed: "Maine Coon",
    ownerName: "Paolo Neri",
    code: "UNI-004",
  },
];

function pad(num: number) {
  return num.toString().padStart(2, "0");
}

function todayIsoLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad(h)}:${pad(m)}`;
}

function getDayKeyFromDate(date: string): keyof VetSchedule {
  const dayIndex = new Date(`${date}T12:00:00`).getDay();

  switch (dayIndex) {
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

function isWithinShift(time: string, shift: WeeklyShift): boolean {
  if (!shift.enabled) return false;

  const current = timeToMinutes(time);
  const start = timeToMinutes(shift.start);
  const end = timeToMinutes(shift.end);

  return current >= start && current < end;
}

function isWithinVetBreak(time: string, shift: WeeklyShift): boolean {
  if (!shift.enabled) return false;

  const current = timeToMinutes(time);
  const breakStart = timeToMinutes(shift.breakStart);
  const breakEnd = timeToMinutes(shift.breakEnd);

  return current >= breakStart && current < breakEnd;
}

function loadAgendaSettings(): AgendaSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  for (const key of SETTINGS_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      return {
        clinicName: parsed?.clinicName || DEFAULT_SETTINGS.clinicName,
        startHour: parsed?.startHour || DEFAULT_SETTINGS.startHour,
        endHour: parsed?.endHour || DEFAULT_SETTINGS.endHour,
        breakStart: parsed?.breakStart || DEFAULT_SETTINGS.breakStart,
        breakEnd: parsed?.breakEnd || DEFAULT_SETTINGS.breakEnd,
        slotMinutes:
          typeof parsed?.slotMinutes === "number" && parsed.slotMinutes > 0
            ? parsed.slotMinutes
            : DEFAULT_SETTINGS.slotMinutes,
        vets:
          Array.isArray(parsed?.vets) && parsed.vets.length > 0
            ? parsed.vets.map((v: any, index: number) => ({
                id: v?.id || `vet-${index + 1}`,
                name: v?.name || `Veterinario ${index + 1}`,
                schedule: v?.schedule || DEFAULT_SETTINGS.vets[0].schedule,
              }))
            : DEFAULT_SETTINGS.vets,
        rooms:
          Array.isArray(parsed?.rooms) && parsed.rooms.length > 0
            ? parsed.rooms.map((r: any, index: number) => ({
                id: r?.id || `room-${index + 1}`,
                name: r?.name || `Stanza ${index + 1}`,
              }))
            : DEFAULT_SETTINGS.rooms,
        visitTypes:
          Array.isArray(parsed?.visitTypes) && parsed.visitTypes.length > 0
            ? parsed.visitTypes.map((t: any, index: number) => ({
                id: t?.id || `type-${index + 1}`,
                label: t?.label || `Tipo visita ${index + 1}`,
                duration:
                  typeof t?.duration === "number" && t.duration > 0 ? t.duration : 30,
              }))
            : DEFAULT_SETTINGS.visitTypes,
      };
    } catch {
      // ignora valori corrotti e continua
    }
  }

  return DEFAULT_SETTINGS;
}

function loadAppointments(): DemoAppointment[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(APPOINTMENTS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAppointments(items: DemoAppointment[]) {
  window.localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(items));
}

function isBreakTime(
  time: string,
  breakStart: string,
  breakEnd: string
): boolean {
  const t = timeToMinutes(time);
  return t >= timeToMinutes(breakStart) && t < timeToMinutes(breakEnd);
}

function generateTimes(startHour: string, endHour: string, slotMinutes: number) {
  const start = timeToMinutes(startHour);
  const end = timeToMinutes(endHour);

  const times: string[] = [];
  for (let cursor = start; cursor < end; cursor += slotMinutes) {
    times.push(minutesToTime(cursor));
  }

  return times;
}

export default function AgendaDemoPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT_SETTINGS);
  const [appointments, setAppointments] = useState<DemoAppointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIsoLocal());
  const [selectedVetFilter, setSelectedVetFilter] = useState<string>("all");

  const [bookingTarget, setBookingTarget] = useState<{
    time: string;
    vetId: string;
    roomId: string;
  } | null>(null);

  const [selectedAnimalId, setSelectedAnimalId] = useState(DEMO_ANIMALS[0].id);
  const [selectedVisitTypeId, setSelectedVisitTypeId] = useState(
    DEFAULT_SETTINGS.visitTypes[0].id
  );
  const [bookingNotes, setBookingNotes] = useState("");

  useEffect(() => {
    setMounted(true);

    const loadedSettings = loadAgendaSettings();
    setSettings(loadedSettings);
    setSelectedVisitTypeId(loadedSettings.visitTypes[0]?.id || "");

    const loadedAppointments = loadAppointments();
    setAppointments(loadedAppointments);
  }, []);

  const dayAppointments = useMemo(() => {
    return appointments.filter((item) => item.date === selectedDate);
  }, [appointments, selectedDate]);

  const activeVetsForDay = useMemo(() => {
    const dayKey = getDayKeyFromDate(selectedDate);

    return settings.vets.filter((vet) => {
      const shift = vet.schedule?.[dayKey as keyof typeof vet.schedule];
      return Boolean(shift?.enabled);
    });
  }, [settings.vets, selectedDate]);

  const gridRows = useMemo(() => {
    const times = generateTimes("00:00", "23:59", settings.slotMinutes);
    const rows: SlotRow[] = [];
    const dayKey = getDayKeyFromDate(selectedDate);

    const vetsToShow =
      selectedVetFilter === "all"
        ? settings.vets
        : settings.vets.filter((vet) => vet.id === selectedVetFilter);

    for (const vet of vetsToShow) {
      const shift = vet.schedule?.[dayKey];
      if (!shift || !shift.enabled) continue;

      for (const time of times) {
        if (!isWithinShift(time, shift)) continue;

        for (const room of settings.rooms) {
          const appointment = dayAppointments.find(
            (item) =>
              item.time === time &&
              item.vetId === vet.id &&
              item.roomId === room.id
          );

          rows.push({
            time,
            isBreak: isWithinVetBreak(time, shift),
            vetId: vet.id,
            roomId: room.id,
            appointment,
          });
        }
      }
    }

    rows.sort((a, b) => {
      const timeDiff = timeToMinutes(a.time) - timeToMinutes(b.time);
      if (timeDiff !== 0) return timeDiff;
      return a.vetId.localeCompare(b.vetId);
    });

    return rows;
  }, [settings, dayAppointments, selectedDate, selectedVetFilter]);

  const selectedAnimal = DEMO_ANIMALS.find((a) => a.id === selectedAnimalId);
  const selectedVisitType = settings.visitTypes.find(
    (t) => t.id === selectedVisitTypeId
  );

  function openBooking(time: string, vetId: string, roomId: string) {
    setBookingTarget({ time, vetId, roomId });
    setSelectedAnimalId(DEMO_ANIMALS[0]?.id || "");
    setSelectedVisitTypeId(settings.visitTypes[0]?.id || "");
    setBookingNotes("");
  }

  function closeBooking() {
    setBookingTarget(null);
    setBookingNotes("");
  }

  function handleCreateAppointment() {
    if (!bookingTarget || !selectedAnimal || !selectedVisitType) return;

    const alreadyExists = appointments.some(
      (item) =>
        item.date === selectedDate &&
        item.time === bookingTarget.time &&
        item.vetId === bookingTarget.vetId &&
        item.roomId === bookingTarget.roomId
    );

    if (alreadyExists) {
      alert("Questo slot è già occupato.");
      return;
    }

    const newAppointment: DemoAppointment = {
      id: crypto.randomUUID(),
      date: selectedDate,
      time: bookingTarget.time,
      vetId: bookingTarget.vetId,
      roomId: bookingTarget.roomId,
      animalId: selectedAnimal.id,
      animalName: selectedAnimal.name,
      ownerName: selectedAnimal.ownerName,
      visitTypeId: selectedVisitType.id,
      visitTypeLabel: selectedVisitType.label,
      duration: selectedVisitType.duration,
      notes: bookingNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...appointments, newAppointment];
    setAppointments(updated);
    saveAppointments(updated);
    closeBooking();
  }

  function handleDeleteAppointment(id: string) {
    const confirmed = window.confirm("Vuoi eliminare questo appuntamento?");
    if (!confirmed) return;

    const updated = appointments.filter((item) => item.id !== id);
    setAppointments(updated);
    saveAppointments(updated);
  }

  const stats = useMemo(() => {
    const total = dayAppointments.length;
    const vaccines = dayAppointments.filter((a) => a.visitTypeId === "vaccine").length;
    const followUps = dayAppointments.filter((a) => a.visitTypeId === "follow_up").length;

    return { total, vaccines, followUps };
  }, [dayAppointments]);

  if (!mounted) {
    return (
      <div className="p-6">
        <div className="text-sm text-neutral-500">Caricamento agenda demo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
              UNIMALIA · Demo veterinario
            </p>
            <h1 className="mt-1 text-3xl font-bold text-neutral-900">
              Agenda clinica demo
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-neutral-600">
              Obiettivo demo: mostrare in pochi minuti agenda, identità animale e
              cartella clinica. Ora il pulsante <strong>Prenota</strong> crea davvero
              un appuntamento in localStorage.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Data agenda
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Veterinario
              </label>
              <select
                value={selectedVetFilter}
                onChange={(e) => setSelectedVetFilter(e.target.value)}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">Tutti i veterinari</option>
                {activeVetsForDay.map((vet) => (
                  <option key={vet.id} value={vet.id}>
                    {vet.name}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/professionisti/impostazioni/agenda"
              className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Apri impostazioni agenda
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Clinica
            </div>
            <div className="mt-2 text-lg font-bold text-neutral-900">
              {settings.clinicName}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Appuntamenti del giorno
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.total}</div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Vaccini
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">
              {stats.vaccines}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Ricontrolli
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">
              {stats.followUps}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Veterinari in turno nel giorno selezionato
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {activeVetsForDay.length === 0 ? (
              <div className="text-sm text-neutral-500">
                Nessun veterinario attivo in questa data.
              </div>
            ) : (
              activeVetsForDay.map((vet) => (
                <div
                  key={vet.id}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
                >
                  {vet.name}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          <strong>Nota demo:</strong> gli appuntamenti vengono salvati in localStorage
          con chiave <code>unimalia_agenda_demo_appointments</code>. Quindi restano
          visibili al refresh del browser, ma non sono ancora su database.
        </div>

        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    Ora
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    Veterinario
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    Stanza
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    Stato
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    Animale
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    Prestazione
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    Azioni
                  </th>
                </tr>
              </thead>

              <tbody>
                {gridRows.map((row) => {
                  const vet = settings.vets.find((v) => v.id === row.vetId);
                  const room = settings.rooms.find((r) => r.id === row.roomId);

                  if (row.isBreak) {
                    return (
                      <tr
                        key={`${row.time}-${row.vetId}-${row.roomId}`}
                        className="bg-neutral-50"
                      >
                        <td className="border-b border-neutral-100 px-4 py-4 text-sm font-semibold text-neutral-700">
                          {row.time}
                        </td>
                        <td className="border-b border-neutral-100 px-4 py-4 text-sm text-neutral-600">
                          {vet?.name}
                        </td>
                        <td className="border-b border-neutral-100 px-4 py-4 text-sm text-neutral-600">
                          {room?.name}
                        </td>
                        <td
                          colSpan={4}
                          className="border-b border-neutral-100 px-4 py-4 text-sm font-medium text-amber-700"
                        >
                          Pausa clinica
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={`${row.time}-${row.vetId}-${row.roomId}`}
                      className="align-top hover:bg-neutral-50"
                    >
                      <td className="border-b border-neutral-100 px-4 py-4 text-sm font-semibold text-neutral-800">
                        {row.time}
                      </td>
                      <td className="border-b border-neutral-100 px-4 py-4 text-sm text-neutral-700">
                        {vet?.name}
                      </td>
                      <td className="border-b border-neutral-100 px-4 py-4 text-sm text-neutral-700">
                        {room?.name}
                      </td>
                      <td className="border-b border-neutral-100 px-4 py-4 text-sm">
                        {row.appointment ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            Occupato
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            Libero
                          </span>
                        )}
                      </td>
                      <td className="border-b border-neutral-100 px-4 py-4 text-sm text-neutral-700">
                        {row.appointment ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-neutral-900">
                              {row.appointment.animalName}
                            </div>
                            <div className="text-xs text-neutral-500">
                              Proprietario: {row.appointment.ownerName}
                            </div>
                            <Link
                              href={`/professionisti/animali/${row.appointment.animalId}`}
                              className="inline-flex text-xs font-semibold text-emerald-700 hover:underline"
                            >
                              Apri scheda animale
                            </Link>
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="border-b border-neutral-100 px-4 py-4 text-sm text-neutral-700">
                        {row.appointment ? (
                          <div className="space-y-1">
                            <div className="font-medium text-neutral-900">
                              {row.appointment.visitTypeLabel}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {row.appointment.duration} min
                            </div>
                            {row.appointment.notes ? (
                              <div className="text-xs text-neutral-500">
                                Note: {row.appointment.notes}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="border-b border-neutral-100 px-4 py-4 text-sm">
                        {row.appointment ? (
                          <button
                            onClick={() => handleDeleteAppointment(row.appointment!.id)}
                            className="inline-flex rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Elimina
                          </button>
                        ) : (
                          <button
                            onClick={() => openBooking(row.time, row.vetId, row.roomId)}
                            className="inline-flex rounded-2xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                          >
                            Prenota
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {gridRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-neutral-500"
                    >
                      Nessuno slot generato. Controlla le impostazioni agenda.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {bookingTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Nuovo appuntamento
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-neutral-900">
                    Prenota slot {bookingTarget.time}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    Data: <strong>{selectedDate}</strong> · Veterinario:{" "}
                    <strong>
                      {settings.vets.find((v) => v.id === bookingTarget.vetId)?.name}
                    </strong>{" "}
                    · Stanza:{" "}
                    <strong>
                      {settings.rooms.find((r) => r.id === bookingTarget.roomId)?.name}
                    </strong>
                  </p>
                </div>

                <button
                  onClick={closeBooking}
                  className="rounded-2xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Chiudi
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-800">
                    Animale
                  </label>
                  <select
                    value={selectedAnimalId}
                    onChange={(e) => setSelectedAnimalId(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  >
                    {DEMO_ANIMALS.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {animal.name} · {animal.species} · {animal.ownerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-800">
                    Tipo prestazione
                  </label>
                  <select
                    value={selectedVisitTypeId}
                    onChange={(e) => setSelectedVisitTypeId(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  >
                    {settings.visitTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label} · {type.duration} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedAnimal ? (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Identità animale
                  </div>
                  <div className="mt-2 text-sm text-neutral-700">
                    <strong>{selectedAnimal.name}</strong> · {selectedAnimal.species} ·{" "}
                    {selectedAnimal.breed}
                  </div>
                  <div className="mt-1 text-sm text-neutral-700">
                    Proprietario: {selectedAnimal.ownerName}
                  </div>
                  <div className="mt-1 text-sm text-neutral-700">
                    Codice animale: {selectedAnimal.code}
                  </div>
                </div>
              ) : null}

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Note appuntamento
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={4}
                  placeholder="Inserisci note cliniche o organizzative..."
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={closeBooking}
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCreateAppointment}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Conferma prenotazione
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}