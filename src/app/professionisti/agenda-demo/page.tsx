"use client";

import { useEffect, useMemo, useState } from "react";

type VisitType = {
  id: string;
  label: string;
  durationMin: number;
  roomType: "visit" | "surgery";
  species: "all" | "dog" | "cat";
};

type Vet = {
  id: string;
  name: string;
  shiftStart: string;
  shiftEnd: string;
};

type Room = {
  id: string;
  name: string;
  type: "visit" | "surgery";
};

type Appointment = {
  id: string;
  time: string;
  durationMin: number;
  vetId: string;
  roomId: string;
  animalName: string;
  visitTypeId: string;
};

const STORAGE_KEY = "unimalia_agenda_settings_v1";

type AgendaSettingsPayload = {
  clinicStart: string;
  clinicEnd: string;
  lunchStart: string;
  lunchEnd: string;
  rooms: Room[];
  visitSettings: VisitType[];
};

function loadAgendaSettings(): AgendaSettingsPayload | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AgendaSettingsPayload;
  } catch {
    return null;
  }
}

const DEFAULT_VISIT_TYPES: VisitType[] = [
  { id: "vaccine", label: "Vaccino", durationMin: 15, roomType: "visit", species: "all" },
  { id: "visit", label: "Visita base", durationMin: 20, roomType: "visit", species: "all" },
  {
    id: "vaccine_blood",
    label: "Vaccino + esame del sangue",
    durationMin: 30,
    roomType: "visit",
    species: "all",
  },
  {
    id: "cat_check",
    label: "Controllo gatto",
    durationMin: 20,
    roomType: "visit",
    species: "cat",
  },
  {
    id: "dog_skin",
    label: "Controllo dermatologico cane",
    durationMin: 30,
    roomType: "visit",
    species: "dog",
  },
  { id: "surgery", label: "Intervento", durationMin: 120, roomType: "surgery", species: "all" },
];

const VETS: Vet[] = [
  { id: "x", name: "Dr. X", shiftStart: "11:00", shiftEnd: "20:00" },
  { id: "y", name: "Dr. Y", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "z", name: "Dr. Z", shiftStart: "09:00", shiftEnd: "12:00" },
  { id: "q", name: "Dr. Q", shiftStart: "10:00", shiftEnd: "19:00" },
];

const DEFAULT_ROOMS: Room[] = [
  { id: "visit-1", name: "Stanza Visite 1", type: "visit" },
  { id: "visit-2", name: "Stanza Visite 2", type: "visit" },
  { id: "surgery-1", name: "Sala Operatoria", type: "surgery" },
];

const APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    time: "09:00",
    durationMin: 20,
    vetId: "y",
    roomId: "visit-1",
    animalName: "Luna",
    visitTypeId: "visit",
  },
  {
    id: "a2",
    time: "09:30",
    durationMin: 15,
    vetId: "y",
    roomId: "visit-2",
    animalName: "Leo",
    visitTypeId: "vaccine",
  },
  {
    id: "a3",
    time: "10:00",
    durationMin: 120,
    vetId: "x",
    roomId: "surgery-1",
    animalName: "Mia",
    visitTypeId: "surgery",
  },
  {
    id: "a4",
    time: "10:00",
    durationMin: 120,
    vetId: "q",
    roomId: "surgery-1",
    animalName: "Mia",
    visitTypeId: "surgery",
  },
  {
    id: "a5",
    time: "10:30",
    durationMin: 20,
    vetId: "y",
    roomId: "visit-1",
    animalName: "Kira",
    visitTypeId: "visit",
  },
  {
    id: "a6",
    time: "11:00",
    durationMin: 15,
    vetId: "x",
    roomId: "visit-2",
    animalName: "Nina",
    visitTypeId: "vaccine",
  },
];

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function isInLunchBreak(start: number, end: number, lunchStart: string, lunchEnd: string) {
  const lunchStartMin = toMinutes(lunchStart);
  const lunchEndMin = toMinutes(lunchEnd);
  return overlaps(start, end, lunchStartMin, lunchEndMin);
}

function getVisitTypeById(id: string, visitTypes: VisitType[]) {
  return visitTypes.find((v) => v.id === id) || null;
}

export default function AgendaDemoPage() {
  const [clinicStart, setClinicStart] = useState("09:00");
  const [clinicEnd, setClinicEnd] = useState("19:00");
  const [lunchStart, setLunchStart] = useState("13:00");
  const [lunchEnd, setLunchEnd] = useState("14:00");
  const [visitTypes, setVisitTypes] = useState<VisitType[]>(DEFAULT_VISIT_TYPES);
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);

  const [animalName, setAnimalName] = useState("Luna");
  const [species, setSpecies] = useState<"dog" | "cat">("dog");
  const [vetId, setVetId] = useState("y");
  const [visitTypeId, setVisitTypeId] = useState("vaccine");

  useEffect(() => {
    const saved = loadAgendaSettings();
    if (!saved) return;

    setClinicStart(saved.clinicStart || "09:00");
    setClinicEnd(saved.clinicEnd || "19:00");
    setLunchStart(saved.lunchStart || "13:00");
    setLunchEnd(saved.lunchEnd || "14:00");
    setVisitTypes(Array.isArray(saved.visitSettings) ? saved.visitSettings : DEFAULT_VISIT_TYPES);
    setRooms(Array.isArray(saved.rooms) ? saved.rooms : DEFAULT_ROOMS);
  }, []);

  const filteredVisitTypes = useMemo(() => {
    return visitTypes.filter((v) => v.species === "all" || v.species === species);
  }, [species, visitTypes]);

  const selectedVisitType = useMemo(() => {
    const match = filteredVisitTypes.find((v) => v.id === visitTypeId);
    return match || filteredVisitTypes[0] || null;
  }, [filteredVisitTypes, visitTypeId]);

  const selectedVet = useMemo(() => {
    return VETS.find((v) => v.id === vetId) || null;
  }, [vetId]);

  const availableSlots = useMemo(() => {
    if (!selectedVisitType || !selectedVet) return [];

    const duration = selectedVisitType.durationMin;
    const vetStart = Math.max(toMinutes(selectedVet.shiftStart), toMinutes(clinicStart));
    const vetEnd = Math.min(toMinutes(selectedVet.shiftEnd), toMinutes(clinicEnd));

    const candidateRooms = rooms.filter((r) => r.type === selectedVisitType.roomType);

    const slots: Array<{ time: string; roomName: string }> = [];

    for (let t = vetStart; t + duration <= vetEnd; t += 15) {
      const slotEnd = t + duration;

      if (isInLunchBreak(t, slotEnd, lunchStart, lunchEnd)) continue;

      const vetBusy = APPOINTMENTS.some((a) => {
        if (a.vetId !== selectedVet.id) return false;
        const aStart = toMinutes(a.time);
        const aEnd = aStart + a.durationMin;
        return overlaps(t, slotEnd, aStart, aEnd);
      });

      if (vetBusy) continue;

      const freeRoom = candidateRooms.find((room) => {
        const roomBusy = APPOINTMENTS.some((a) => {
          if (a.roomId !== room.id) return false;
          const aStart = toMinutes(a.time);
          const aEnd = aStart + a.durationMin;
          return overlaps(t, slotEnd, aStart, aEnd);
        });

        return !roomBusy;
      });

      if (!freeRoom) continue;

      slots.push({
        time: toHHMM(t),
        roomName: freeRoom.name,
      });
    }

    return slots.slice(0, 8);
  }, [selectedVisitType, selectedVet, rooms, clinicStart, clinicEnd, lunchStart, lunchEnd]);

  const todayAgenda = useMemo(() => {
    return APPOINTMENTS.map((a) => {
      const vt = getVisitTypeById(a.visitTypeId, visitTypes);
      const vet = VETS.find((v) => v.id === a.vetId);
      const room = rooms.find((r) => r.id === a.roomId);

      return {
        ...a,
        visitTypeLabel: vt?.label || a.visitTypeId,
        vetName: vet?.name || a.vetId,
        roomName: room?.name || a.roomId,
      };
    }).sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  }, [visitTypes, rooms]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Demo agenda UNIMALIA
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                Agenda clinica intelligente
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                Il veterinario sceglie animale, specie e tipo visita. UNIMALIA propone
                automaticamente i primi slot liberi compatibili con turno, pausa comune e stanze.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Pausa clinica automatica: {lunchStart}–{lunchEnd}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-4">
            <h2 className="text-lg font-semibold text-zinc-900">Prenotazione rapida</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Simula la prenotazione come farebbe una clinica medio-piccola.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Nome animale
                </span>
                <input
                  value={animalName}
                  onChange={(e) => setAnimalName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Specie
                </span>
                <select
                  value={species}
                  onChange={(e) => {
                    const next = e.target.value as "dog" | "cat";
                    setSpecies(next);
                    const nextOptions = visitTypes.filter(
                      (v) => v.species === "all" || v.species === next
                    );
                    if (!nextOptions.some((v) => v.id === visitTypeId)) {
                      setVisitTypeId(nextOptions[0]?.id || "vaccine");
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                >
                  <option value="dog">Cane</option>
                  <option value="cat">Gatto</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Veterinario
                </span>
                <select
                  value={vetId}
                  onChange={(e) => setVetId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                >
                  {VETS.map((vet) => (
                    <option key={vet.id} value={vet.id}>
                      {vet.name} ({vet.shiftStart}–{vet.shiftEnd})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Tipo visita
                </span>
                <select
                  value={visitTypeId}
                  onChange={(e) => setVisitTypeId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                >
                  {filteredVisitTypes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} ({v.durationMin} min)
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Logica automatica
              </div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                <li>• legge turno del veterinario</li>
                <li>• salta la pausa 13:00–14:00</li>
                <li>• controlla la stanza richiesta</li>
                <li>• propone i primi slot davvero liberi</li>
              </ul>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-4">
            <h2 className="text-lg font-semibold text-zinc-900">Primi slot disponibili</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Proposta automatica per {animalName || "animale"}.
            </p>

            <div className="mt-6 space-y-3">
              {availableSlots.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Nessuno slot disponibile con questi vincoli.
                </div>
              ) : (
                availableSlots.map((slot) => (
                  <div
                    key={`${slot.time}-${slot.roomName}`}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                  >
                    <div>
                      <div className="text-base font-semibold text-zinc-900">{slot.time}</div>
                      <div className="text-xs text-zinc-500">{slot.roomName}</div>
                    </div>

                    <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900">
                      Prenota
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-4">
            <h2 className="text-lg font-semibold text-zinc-900">Agenda di oggi</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Configurazione reale caricata dalle impostazioni agenda della clinica.
            </p>

            <div className="mt-6 space-y-3">
              {todayAgenda.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-semibold text-zinc-900">{item.time}</div>
                    <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                      {item.roomName}
                    </div>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-zinc-900">
                    {item.animalName} • {item.visitTypeLabel}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {item.vetName} • {item.durationMin} min
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}