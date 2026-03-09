"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AgendaSettings,
  Room,
  Vet,
  VetSchedule,
  VetScheduleOverride,
  VisitType,
  WeeklyShift,
} from "@/lib/agenda/types";
import {
  createDefaultAgendaSettings,
  loadAgendaAppointments,
  loadAgendaOverrides,
  loadAgendaSettings,
  saveAgendaOverrides,
  saveAgendaSettings,
} from "@/lib/agenda/storage";
import { DAY_LABELS, todayIsoLocal } from "@/lib/agenda/utils";

function createDefaultShift(enabled = false): WeeklyShift {
  return {
    enabled,
    start: "09:00",
    end: "18:00",
    breakStart: "13:00",
    breakEnd: "14:00",
  };
}

function createDefaultSchedule(): VetSchedule {
  return {
    monday: createDefaultShift(true),
    tuesday: createDefaultShift(true),
    wednesday: createDefaultShift(true),
    thursday: createDefaultShift(true),
    friday: createDefaultShift(true),
    saturday: createDefaultShift(false),
    sunday: createDefaultShift(false),
  };
}

function createVet(index: number): Vet {
  return {
    id: crypto.randomUUID(),
    name: `Nuovo veterinario ${index}`,
    schedule: createDefaultSchedule(),
  };
}

function createRoom(index: number): Room {
  return {
    id: crypto.randomUUID(),
    name: `Stanza ${index}`,
  };
}

function createVisitType(index: number): VisitType {
  return {
    id: `custom-${crypto.randomUUID()}`,
    label: `Prestazione ${index}`,
    duration: 30,
  };
}

export default function AgendaSettingsPage() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<AgendaSettings>(createDefaultAgendaSettings());
  const [overrides, setOverrides] = useState<VetScheduleOverride[]>([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);

  const [overrideVetId, setOverrideVetId] = useState("");
  const [overrideDate, setOverrideDate] = useState(todayIsoLocal());
  const [overrideEnabled, setOverrideEnabled] = useState(true);
  const [overrideStart, setOverrideStart] = useState("09:00");
  const [overrideEnd, setOverrideEnd] = useState("18:00");
  const [overrideBreakStart, setOverrideBreakStart] = useState("13:00");
  const [overrideBreakEnd, setOverrideBreakEnd] = useState("14:00");
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    const loadedSettings = loadAgendaSettings();
    const loadedOverrides = loadAgendaOverrides();
    const loadedAppointments = loadAgendaAppointments();

    setSettings(loadedSettings);
    setOverrides(loadedOverrides);
    setAppointmentsCount(loadedAppointments.length);
    setOverrideVetId(loadedSettings.vets[0]?.id || "");
    setLoaded(true);
  }, []);

  function persistSettings(next: AgendaSettings) {
    setSettings(next);
    saveAgendaSettings(next);
  }

  function persistOverrides(next: VetScheduleOverride[]) {
    setOverrides(next);
    saveAgendaOverrides(next);
  }

  function updateClinicName(value: string) {
    persistSettings({ ...settings, clinicName: value });
  }

  function updateSlotMinutes(value: number) {
    persistSettings({
      ...settings,
      slotMinutes: Number.isFinite(value) && value > 0 ? value : 30,
    });
  }

  function addVet() {
    persistSettings({
      ...settings,
      vets: [...settings.vets, createVet(settings.vets.length + 1)],
    });
  }

  function removeVet(vetId: string) {
    const nextVets = settings.vets.filter((vet) => vet.id !== vetId);
    const nextOverrides = overrides.filter((item) => item.vetId !== vetId);

    persistSettings({
      ...settings,
      vets: nextVets,
    });
    persistOverrides(nextOverrides);

    if (overrideVetId === vetId) {
      setOverrideVetId(nextVets[0]?.id || "");
    }
  }

  function updateVetName(vetId: string, value: string) {
    persistSettings({
      ...settings,
      vets: settings.vets.map((vet) =>
        vet.id === vetId ? { ...vet, name: value } : vet
      ),
    });
  }

  function updateVetShift(
    vetId: string,
    day: keyof VetSchedule,
    field: keyof WeeklyShift,
    value: string | boolean
  ) {
    persistSettings({
      ...settings,
      vets: settings.vets.map((vet) => {
        if (vet.id !== vetId) return vet;

        return {
          ...vet,
          schedule: {
            ...vet.schedule,
            [day]: {
              ...vet.schedule[day],
              [field]: value,
            },
          },
        };
      }),
    });
  }

  function addRoom() {
    persistSettings({
      ...settings,
      rooms: [...settings.rooms, createRoom(settings.rooms.length + 1)],
    });
  }

  function updateRoom(roomId: string, value: string) {
    persistSettings({
      ...settings,
      rooms: settings.rooms.map((room) =>
        room.id === roomId ? { ...room, name: value } : room
      ),
    });
  }

  function removeRoom(roomId: string) {
    persistSettings({
      ...settings,
      rooms: settings.rooms.filter((room) => room.id !== roomId),
    });
  }

  function addVisitType() {
    persistSettings({
      ...settings,
      visitTypes: [...settings.visitTypes, createVisitType(settings.visitTypes.length + 1)],
    });
  }

  function updateVisitType(
    visitTypeId: string,
    field: keyof VisitType,
    value: string | number
  ) {
    persistSettings({
      ...settings,
      visitTypes: settings.visitTypes.map((item) =>
        item.id === visitTypeId ? { ...item, [field]: value } : item
      ),
    });
  }

  function removeVisitType(visitTypeId: string) {
    persistSettings({
      ...settings,
      visitTypes: settings.visitTypes.filter((item) => item.id !== visitTypeId),
    });
  }

  function addOverride() {
    if (!overrideVetId || !overrideDate) return;

    const newOverride: VetScheduleOverride = {
      id: crypto.randomUUID(),
      vetId: overrideVetId,
      date: overrideDate,
      enabled: overrideEnabled,
      start: overrideStart,
      end: overrideEnd,
      breakStart: overrideBreakStart,
      breakEnd: overrideBreakEnd,
      reason: overrideReason.trim(),
    };

    const filtered = overrides.filter(
      (item) => !(item.vetId === overrideVetId && item.date === overrideDate)
    );

    const next = [...filtered, newOverride].sort((a, b) => a.date.localeCompare(b.date));
    persistOverrides(next);
    setOverrideReason("");
  }

  function deleteOverride(id: string) {
    persistOverrides(overrides.filter((item) => item.id !== id));
  }

  const overridesByVet = useMemo(() => {
    return settings.vets.map((vet) => ({
      vet,
      items: overrides.filter((item) => item.vetId === vet.id),
    }));
  }, [settings.vets, overrides]);

  if (!loaded) {
    return (
      <div className="p-6 text-sm text-neutral-500">
        Caricamento impostazioni agenda...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              UNIMALIA · Impostazioni agenda
            </p>
            <h1 className="mt-1 text-3xl font-bold text-neutral-900">
              Agenda clinica definitiva
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-neutral-600">
              Qui gestisci struttura clinica, veterinari, turni settimanali,
              eccezioni mensili per data, stanze e prestazioni.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/professionisti/agenda"
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Apri agenda
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
              Veterinari
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">
              {settings.vets.length}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Stanze
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">
              {settings.rooms.length}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Appuntamenti salvati
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">
              {appointmentsCount}
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900">Impostazioni generali</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Nome clinica
                </label>
                <input
                  value={settings.clinicName}
                  onChange={(e) => updateClinicName(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Durata slot base (minuti)
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={settings.slotMinutes}
                  onChange={(e) => updateSlotMinutes(Number(e.target.value))}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-neutral-900">Stanze</h2>
              <button
                onClick={addRoom}
                className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Aggiungi stanza
              </button>
            </div>

            <div className="space-y-3">
              {settings.rooms.map((room) => (
                <div key={room.id} className="flex gap-3">
                  <input
                    value={room.name}
                    onChange={(e) => updateRoom(room.id, e.target.value)}
                    className="flex-1 rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => removeRoom(room.id)}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
                    Elimina
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-neutral-900">Prestazioni</h2>
            <button
              onClick={addVisitType}
              className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Aggiungi prestazione
            </button>
          </div>

          <div className="space-y-3">
            {settings.visitTypes.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[1fr_140px_120px]"
              >
                <input
                  value={item.label}
                  onChange={(e) => updateVisitType(item.id, "label", e.target.value)}
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={item.duration}
                  onChange={(e) =>
                    updateVisitType(item.id, "duration", Number(e.target.value))
                  }
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => removeVisitType(item.id)}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  Elimina
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-neutral-900">Veterinari</h2>
            <button
              onClick={addVet}
              className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Aggiungi veterinario
            </button>
          </div>

          <div className="space-y-6">
            {settings.vets.map((vet, index) => (
              <div
                key={vet.id}
                className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5"
              >
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Veterinario {index + 1}
                    </div>
                    <input
                      value={vet.name}
                      onChange={(e) => updateVetName(vet.id, e.target.value)}
                      className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="lg:pt-7">
                    <button
                      onClick={() => removeVet(vet.id)}
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Elimina veterinario
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                          Giorno
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                          Attivo
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                          Inizio
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                          Fine
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                          Pausa inizio
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                          Pausa fine
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {DAY_LABELS.map((day) => {
                        const shift = vet.schedule[day.key];

                        return (
                          <tr key={day.key} className="border-t border-neutral-200">
                            <td className="px-3 py-3 text-sm font-semibold text-neutral-900">
                              {day.label}
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={shift.enabled}
                                onChange={(e) =>
                                  updateVetShift(vet.id, day.key, "enabled", e.target.checked)
                                }
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="time"
                                value={shift.start}
                                disabled={!shift.enabled}
                                onChange={(e) =>
                                  updateVetShift(vet.id, day.key, "start", e.target.value)
                                }
                                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="time"
                                value={shift.end}
                                disabled={!shift.enabled}
                                onChange={(e) =>
                                  updateVetShift(vet.id, day.key, "end", e.target.value)
                                }
                                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="time"
                                value={shift.breakStart}
                                disabled={!shift.enabled}
                                onChange={(e) =>
                                  updateVetShift(vet.id, day.key, "breakStart", e.target.value)
                                }
                                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="time"
                                value={shift.breakEnd}
                                disabled={!shift.enabled}
                                onChange={(e) =>
                                  updateVetShift(vet.id, day.key, "breakEnd", e.target.value)
                                }
                                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">
            Eccezioni mensili per data
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Qui imposti ferie, straordinari, chiusure o modifiche al turno di un giorno
            preciso. L’override sostituisce il turno settimanale.
          </p>

          <div className="mt-5 grid gap-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Veterinario
              </label>
              <select
                value={overrideVetId}
                onChange={(e) => setOverrideVetId(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                {settings.vets.map((vet) => (
                  <option key={vet.id} value={vet.id}>
                    {vet.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Data
              </label>
              <input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Inizio
              </label>
              <input
                type="time"
                value={overrideStart}
                disabled={!overrideEnabled}
                onChange={(e) => setOverrideStart(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Fine
              </label>
              <input
                type="time"
                value={overrideEnd}
                disabled={!overrideEnabled}
                onChange={(e) => setOverrideEnd(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Pausa inizio
              </label>
              <input
                type="time"
                value={overrideBreakStart}
                disabled={!overrideEnabled}
                onChange={(e) => setOverrideBreakStart(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Pausa fine
              </label>
              <input
                type="time"
                value={overrideBreakEnd}
                disabled={!overrideEnabled}
                onChange={(e) => setOverrideBreakEnd(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:bg-neutral-100"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Motivo
              </label>
              <input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Ferie, assenza, straordinario, sostituzione..."
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800">
                <input
                  type="checkbox"
                  checked={overrideEnabled}
                  onChange={(e) => setOverrideEnabled(e.target.checked)}
                />
                Giorno lavorativo
              </label>
            </div>

            <div className="flex items-end">
              <button
                onClick={addOverride}
                className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Salva override
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {overridesByVet.map(({ vet, items }) => (
              <div key={vet.id} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="mb-3 text-sm font-bold text-neutral-900">{vet.name}</div>

                {items.length === 0 ? (
                  <div className="text-sm text-neutral-500">
                    Nessuna eccezione impostata.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 md:grid-cols-[180px_1fr_180px_120px]"
                      >
                        <div className="text-sm font-semibold text-neutral-900">
                          {item.date}
                        </div>

                        <div className="text-sm text-neutral-700">
                          {item.enabled
                            ? `${item.start} - ${item.end} · pausa ${item.breakStart} - ${item.breakEnd}`
                            : "Assente / giorno chiuso"}
                          {item.reason ? ` · ${item.reason}` : ""}
                        </div>

                        <div className="text-sm text-neutral-500">
                          {item.enabled ? "Override attivo" : "Blocco giornata"}
                        </div>

                        <button
                          onClick={() => deleteOverride(item.id)}
                          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                        >
                          Elimina
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}