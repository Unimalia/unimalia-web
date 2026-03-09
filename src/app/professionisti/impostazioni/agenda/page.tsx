"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

type VisitType = {
  id: string;
  label: string;
  duration: number;
};

type AgendaSettings = {
  clinicName: string;
  slotMinutes: number;
  vets: Vet[];
  rooms: Room[];
  visitTypes: VisitType[];
};

const STORAGE_KEY = "unimalia_agenda_settings";

const DAY_LABELS: { key: keyof VetSchedule; label: string }[] = [
  { key: "monday", label: "Lunedì" },
  { key: "tuesday", label: "Martedì" },
  { key: "wednesday", label: "Mercoledì" },
  { key: "thursday", label: "Giovedì" },
  { key: "friday", label: "Venerdì" },
  { key: "saturday", label: "Sabato" },
  { key: "sunday", label: "Domenica" },
];

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

function createVet(name: string): Vet {
  return {
    id: crypto.randomUUID(),
    name,
    schedule: createDefaultSchedule(),
  };
}

const DEFAULT_SETTINGS: AgendaSettings = {
  clinicName: "Clinica UNIMALIA Demo",
  slotMinutes: 30,
  vets: [createVet("Dott.ssa Rossi"), createVet("Dott. Bianchi")],
  rooms: [
    { id: crypto.randomUUID(), name: "Visita 1" },
    { id: crypto.randomUUID(), name: "Visita 2" },
  ],
  visitTypes: [
    { id: "visit", label: "Visita clinica", duration: 30 },
    { id: "vaccine", label: "Vaccino", duration: 15 },
    { id: "follow_up", label: "Ricontrollo", duration: 20 },
    { id: "therapy", label: "Terapia", duration: 30 },
  ],
};

export default function AgendaSettingsPage() {
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setSettings(parsed);
    } catch {
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoaded(true);
    }
  }, []);

  function saveSettings(next: AgendaSettings) {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function updateClinicName(value: string) {
    saveSettings({ ...settings, clinicName: value });
  }

  function updateSlotMinutes(value: number) {
    saveSettings({
      ...settings,
      slotMinutes: Number.isFinite(value) && value > 0 ? value : 30,
    });
  }

  function addVet() {
    saveSettings({
      ...settings,
      vets: [...settings.vets, createVet(`Nuovo veterinario ${settings.vets.length + 1}`)],
    });
  }

  function removeVet(vetId: string) {
    saveSettings({
      ...settings,
      vets: settings.vets.filter((vet) => vet.id !== vetId),
    });
  }

  function updateVetName(vetId: string, value: string) {
    saveSettings({
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
    saveSettings({
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

  if (!loaded) {
    return <div className="p-6 text-sm text-neutral-500">Caricamento impostazioni agenda...</div>;
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
              Veterinari e turni settimanali
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-neutral-600">
              Qui definisci il team veterinario e i turni veri della settimana.
              L’agenda demo mostrerà gli slot solo quando il veterinario è in servizio.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={addVet}
              className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Aggiungi veterinario
            </button>

            <Link
              href="/professionisti/agenda-demo"
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Vai agenda demo
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="text-sm font-semibold text-emerald-900">
            Sezione chiave da usare adesso
          </div>
          <div className="mt-2 text-sm text-emerald-800">
            In questa pagina trovi subito sotto l’elenco completo dei veterinari, uno per card,
            con i turni di ogni giorno già modificabili.
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
            <h2 className="text-lg font-bold text-neutral-900">Riepilogo team</h2>

            <div className="mt-4 space-y-3">
              {settings.vets.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
                  Nessun veterinario configurato.
                </div>
              ) : (
                settings.vets.map((vet) => (
                  <div
                    key={vet.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="font-semibold text-neutral-900">{vet.name}</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      Giorni attivi:{" "}
                      {
                        DAY_LABELS.filter((day) => vet.schedule[day.key].enabled).length
                      }
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {settings.vets.map((vet, index) => (
            <div
              key={vet.id}
              className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Veterinario {index + 1}
                  </div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-800">
                    Nome veterinario
                  </label>
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

              <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm font-semibold text-neutral-900">
                  Turni settimanali di {vet.name}
                </div>
                <div className="mt-1 text-sm text-neutral-600">
                  Abilita i giorni lavorativi e imposta orari e pausa per ciascun giorno.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-neutral-100">
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
                        <tr key={day.key} className="border-t border-neutral-100">
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
    </div>
  );
}