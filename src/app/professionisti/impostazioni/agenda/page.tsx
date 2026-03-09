"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type VisitSetting = {
  id: string;
  label: string;
  species: "all" | "dog" | "cat";
  durationMin: number;
  roomType: "visit" | "surgery";
};

type RoomSetting = {
  id: string;
  name: string;
  type: "visit" | "surgery";
};

const STORAGE_KEY = "unimalia_agenda_settings_v1";

type AgendaSettingsPayload = {
  clinicStart: string;
  clinicEnd: string;
  lunchStart: string;
  lunchEnd: string;
  rooms: RoomSetting[];
  visitSettings: VisitSetting[];
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

function saveAgendaSettings(payload: AgendaSettingsPayload) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export default function AgendaSettingsPage() {
  const [clinicStart, setClinicStart] = useState("09:00");
  const [clinicEnd, setClinicEnd] = useState("19:00");
  const [lunchStart, setLunchStart] = useState("13:00");
  const [lunchEnd, setLunchEnd] = useState("14:00");

  const [rooms, setRooms] = useState<RoomSetting[]>([
    { id: "visit-1", name: "Stanza Visite 1", type: "visit" },
    { id: "visit-2", name: "Stanza Visite 2", type: "visit" },
    { id: "surgery-1", name: "Sala Operatoria", type: "surgery" },
  ]);

  const [visitSettings, setVisitSettings] = useState<VisitSetting[]>([
    { id: "vaccine", label: "Vaccino", species: "all", durationMin: 15, roomType: "visit" },
    { id: "visit", label: "Visita base", species: "all", durationMin: 20, roomType: "visit" },
    {
      id: "vaccine-blood",
      label: "Vaccino + esame del sangue",
      species: "all",
      durationMin: 30,
      roomType: "visit",
    },
    {
      id: "dog-derm",
      label: "Controllo dermatologico cane",
      species: "dog",
      durationMin: 30,
      roomType: "visit",
    },
    {
      id: "cat-check",
      label: "Controllo gatto",
      species: "cat",
      durationMin: 20,
      roomType: "visit",
    },
    {
      id: "surgery",
      label: "Intervento",
      species: "all",
      durationMin: 120,
      roomType: "surgery",
    },
  ]);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadAgendaSettings();
    if (!saved) return;

    setClinicStart(saved.clinicStart || "09:00");
    setClinicEnd(saved.clinicEnd || "19:00");
    setLunchStart(saved.lunchStart || "13:00");
    setLunchEnd(saved.lunchEnd || "14:00");
    setRooms(Array.isArray(saved.rooms) ? saved.rooms : []);
    setVisitSettings(Array.isArray(saved.visitSettings) ? saved.visitSettings : []);
  }, []);

  function updateVisitSetting(id: string, patch: Partial<VisitSetting>) {
    setVisitSettings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function updateRoom(id: string, patch: Partial<RoomSetting>) {
    setRooms((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addVisitSetting() {
    setVisitSettings((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        label: "Nuova prestazione",
        species: "all",
        durationMin: 20,
        roomType: "visit",
      },
    ]);
  }

  function removeVisitSetting(id: string) {
    setVisitSettings((prev) => prev.filter((item) => item.id !== id));
  }

  function addRoom() {
    setRooms((prev) => [
      ...prev,
      {
        id: `room-${Date.now()}`,
        name: "Nuova stanza",
        type: "visit",
      },
    ]);
  }

  function removeRoom(id: string) {
    setRooms((prev) => prev.filter((item) => item.id !== id));
  }

  const visitRoomsCount = useMemo(() => rooms.filter((r) => r.type === "visit").length, [rooms]);

  const surgeryRoomsCount = useMemo(
    () => rooms.filter((r) => r.type === "surgery").length,
    [rooms]
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 text-sm">
          <Link
            href="/professionisti/impostazioni"
            className="font-semibold text-zinc-700 hover:text-zinc-900"
          >
            ← Torna alle impostazioni
          </Link>
        </div>

        <div className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Impostazioni agenda
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                Agenda clinica su misura
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                Configura orari, pausa, stanze e durata delle prestazioni. L’agenda userà queste
                regole per proporre slot realistici e adatti alla tua clinica.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Demo configurabile pronta per agenda intelligente
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-4">
            <h2 className="text-lg font-semibold text-zinc-900">Orari clinica</h2>
            <p className="mt-1 text-sm text-zinc-600">Base operativa dell’agenda.</p>

            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Apertura
                </span>
                <input
                  type="time"
                  value={clinicStart}
                  onChange={(e) => setClinicStart(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Chiusura
                </span>
                <input
                  type="time"
                  value={clinicEnd}
                  onChange={(e) => setClinicEnd(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Pausa inizio
                </span>
                <input
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Pausa fine
                </span>
                <input
                  type="time"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Stanze</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Le risorse fisiche usate dall’agenda.
                </p>
              </div>

              <button
                type="button"
                onClick={addRoom}
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
              >
                Aggiungi
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="grid gap-3 md:grid-cols-5">
                    <label className="block md:col-span-3">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                        Nome stanza
                      </span>
                      <input
                        value={room.name}
                        onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                        Tipo
                      </span>
                      <select
                        value={room.type}
                        onChange={(e) =>
                          updateRoom(room.id, {
                            type: e.target.value as "visit" | "surgery",
                          })
                        }
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                      >
                        <option value="visit">Visite / vaccini</option>
                        <option value="surgery">Chirurgia</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeRoom(room.id)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-4">
            <h2 className="text-lg font-semibold text-zinc-900">Riepilogo clinica</h2>
            <p className="mt-1 text-sm text-zinc-600">Anteprima della configurazione attuale.</p>

            <div className="mt-6 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Apertura</span>
                <span className="font-semibold text-zinc-900">
                  {clinicStart} – {clinicEnd}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Pausa</span>
                <span className="font-semibold text-zinc-900">
                  {lunchStart} – {lunchEnd}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Stanze visite</span>
                <span className="font-semibold text-zinc-900">{visitRoomsCount}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Sale operatorie</span>
                <span className="font-semibold text-zinc-900">{surgeryRoomsCount}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Prestazioni</span>
                <span className="font-semibold text-zinc-900">{visitSettings.length}</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Questa configurazione sarà usata per proporre slot realistici in agenda e, più
              avanti, per la prenotazione online.
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Tipi di prestazione</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Il veterinario imposta i tempi e l’agenda si adatta.
              </p>
            </div>

            <button
              type="button"
              onClick={addVisitSetting}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
            >
              Aggiungi prestazione
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {visitSettings.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="grid gap-3 md:grid-cols-12">
                  <label className="block md:col-span-4">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Nome prestazione
                    </span>
                    <input
                      value={item.label}
                      onChange={(e) => updateVisitSetting(item.id, { label: e.target.value })}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Specie
                    </span>
                    <select
                      value={item.species}
                      onChange={(e) =>
                        updateVisitSetting(item.id, {
                          species: e.target.value as "all" | "dog" | "cat",
                        })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                    >
                      <option value="all">Tutte</option>
                      <option value="dog">Cane</option>
                      <option value="cat">Gatto</option>
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Durata
                    </span>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={item.durationMin}
                      onChange={(e) =>
                        updateVisitSetting(item.id, {
                          durationMin: Number(e.target.value || 0),
                        })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                    />
                  </label>

                  <label className="block md:col-span-3">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Tipo stanza
                    </span>
                    <select
                      value={item.roomType}
                      onChange={(e) =>
                        updateVisitSetting(item.id, {
                          roomType: e.target.value as "visit" | "surgery",
                        })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                    >
                      <option value="visit">Visite / vaccini</option>
                      <option value="surgery">Chirurgia</option>
                    </select>
                  </label>

                  <div className="flex items-end md:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeVisitSetting(item.id)}
                      className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      X
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900"
            onClick={() => {
              saveAgendaSettings({
                clinicStart,
                clinicEnd,
                lunchStart,
                lunchEnd,
                rooms,
                visitSettings,
              });

              setSaveMessage("Impostazioni agenda salvate localmente ✅");

              window.setTimeout(() => {
                setSaveMessage(null);
              }, 2500);
            }}
          >
            Salva impostazioni
          </button>

          <Link
            href="/professionisti/agenda-demo"
            className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Apri demo agenda
          </Link>
        </div>

        {saveMessage ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {saveMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}