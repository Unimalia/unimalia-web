"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import {
  loadAgendaAppointments,
  loadAgendaOverrides,
  loadAgendaSettings,
} from "@/lib/agenda/storage";
import {
  appointmentIsActive,
  formatDateLabel,
  resolveVetShift,
  todayIsoLocal,
} from "@/lib/agenda/utils";
import {
  AgendaAppointment,
  AgendaSettings,
  VetScheduleOverride,
} from "@/lib/agenda/types";

type AgendaSnapshot = {
  settings: AgendaSettings | null;
  overrides: VetScheduleOverride[];
  appointments: AgendaAppointment[];
};

let cachedSnapshot: AgendaSnapshot = {
  settings: null,
  overrides: [],
  appointments: [],
};

let cachedSerializedSnapshot = JSON.stringify(cachedSnapshot);

function readClientSnapshot(): AgendaSnapshot {
  return {
    settings: loadAgendaSettings(),
    overrides: loadAgendaOverrides(),
    appointments: loadAgendaAppointments(),
  };
}

function getAgendaSnapshot(): AgendaSnapshot {
  if (typeof window === "undefined") {
    return cachedSnapshot;
  }

  const nextSnapshot = readClientSnapshot();
  const nextSerializedSnapshot = JSON.stringify(nextSnapshot);

  if (nextSerializedSnapshot === cachedSerializedSnapshot) {
    return cachedSnapshot;
  }

  cachedSnapshot = nextSnapshot;
  cachedSerializedSnapshot = nextSerializedSnapshot;

  return cachedSnapshot;
}

function getAgendaServerSnapshot(): AgendaSnapshot {
  return {
    settings: null,
    overrides: [],
    appointments: [],
  };
}

function subscribeAgendaStore(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => {
    callback();
  };

  window.addEventListener("storage", handler);
  window.addEventListener("unimalia-agenda-storage-changed", handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("unimalia-agenda-storage-changed", handler);
  };
}

export default function ClinicAgendaDashboardWidget() {
  const { settings, overrides, appointments } = useSyncExternalStore(
    subscribeAgendaStore,
    getAgendaSnapshot,
    getAgendaServerSnapshot
  );

  const today = todayIsoLocal();

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((item) => item.date === today && appointmentIsActive(item))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, today]);

  const todayVets = useMemo(() => {
    if (!settings) return [];

    return settings.vets.filter((vet) =>
      resolveVetShift(vet, today, overrides).enabled
    );
  }, [settings, today, overrides]);

  if (!settings) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="text-sm text-neutral-500">Caricamento agenda...</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Agenda clinica
          </div>
          <h2 className="mt-1 text-2xl font-bold text-neutral-900">
            Agenda di oggi
          </h2>
          <p className="mt-1 text-sm text-neutral-600">{formatDateLabel(today)}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/professionisti/agenda"
            className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Apri agenda completa
          </Link>

          <Link
            href="/professionisti/impostazioni/agenda"
            className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Impostazioni agenda
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Appuntamenti oggi
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {todayAppointments.length}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Veterinari in turno
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {todayVets.length}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Clinica
          </div>
          <div className="mt-2 text-lg font-bold text-neutral-900">
            {settings.clinicName}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 text-sm font-semibold text-neutral-900">
          Veterinari attivi oggi
        </div>

        <div className="flex flex-wrap gap-3">
          {todayVets.length === 0 ? (
            <div className="text-sm text-neutral-500">Nessun veterinario in turno oggi.</div>
          ) : (
            todayVets.map((vet) => (
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

      <div className="mt-6">
        <div className="mb-3 text-sm font-semibold text-neutral-900">
          Prossimi appuntamenti di oggi
        </div>

        <div className="space-y-3">
          {todayAppointments.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
              Nessun appuntamento in agenda per oggi.
            </div>
          ) : (
            todayAppointments.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[120px_1fr_180px]"
              >
                <div className="text-sm font-bold text-neutral-900">
                  {item.startTime} - {item.endTime}
                </div>

                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {item.animalName}
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">
                    {item.visitTypeLabel} · {item.ownerName}
                  </div>
                </div>

                <div className="text-sm text-neutral-600">{item.status}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}