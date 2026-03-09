"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AgendaAppointment,
  AgendaSettings,
  AppointmentStatus,
  VetScheduleOverride,
} from "@/lib/agenda/types";
import {
  loadAgendaAppointments,
  loadAgendaOverrides,
  loadAgendaSettings,
  saveAgendaAppointments,
} from "@/lib/agenda/storage";
import {
  addDays,
  appointmentCoversSlot,
  appointmentIsActive,
  appointmentStartsAtSlot,
  DAY_LABELS,
  doesIntervalOverlap,
  formatDateLabel,
  generateSlots,
  getEndTimeFromDuration,
  getWeekDates,
  isSlotInBreak,
  resolveVetShift,
  todayIsoLocal,
} from "@/lib/agenda/utils";

type AppointmentFormState = {
  id: string | null;
  date: string;
  startTime: string;
  vetId: string;
  roomId: string;
  animalId: string;
  animalName: string;
  ownerName: string;
  visitTypeId: string;
  notes: string;
  status: AppointmentStatus;
};

const EMPTY_FORM: AppointmentFormState = {
  id: null,
  date: todayIsoLocal(),
  startTime: "09:00",
  vetId: "",
  roomId: "",
  animalId: "",
  animalName: "",
  ownerName: "",
  visitTypeId: "",
  notes: "",
  status: "confirmed",
};

export default function AgendaPage() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<AgendaSettings | null>(null);
  const [overrides, setOverrides] = useState<VetScheduleOverride[]>([]);
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIsoLocal());
  const [selectedVetFilter, setSelectedVetFilter] = useState("all");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<AppointmentFormState>(EMPTY_FORM);

  useEffect(() => {
    const loadedSettings = loadAgendaSettings();
    const loadedOverrides = loadAgendaOverrides();
    const loadedAppointments = loadAgendaAppointments();

    setSettings(loadedSettings);
    setOverrides(loadedOverrides);
    setAppointments(loadedAppointments);
    setForm({
      ...EMPTY_FORM,
      date: todayIsoLocal(),
      vetId: loadedSettings.vets[0]?.id || "",
      roomId: loadedSettings.rooms[0]?.id || "",
      visitTypeId: loadedSettings.visitTypes[0]?.id || "",
    });
    setLoaded(true);
  }, []);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const dayAppointments = useMemo(() => {
    return appointments.filter((item) => item.date === selectedDate);
  }, [appointments, selectedDate]);

  const visibleAppointments = useMemo(() => {
    return dayAppointments.filter((item) => {
      const vetOk = selectedVetFilter === "all" || item.vetId === selectedVetFilter;
      const roomOk = selectedRoomFilter === "all" || item.roomId === selectedRoomFilter;
      return vetOk && roomOk;
    });
  }, [dayAppointments, selectedVetFilter, selectedRoomFilter]);

  const activeVetsForDay = useMemo(() => {
    if (!settings) return [];
    return settings.vets.filter((vet) => resolveVetShift(vet, selectedDate, overrides).enabled);
  }, [settings, selectedDate, overrides]);

  const slotsByVet = useMemo(() => {
    if (!settings) return [];

    const vetsToShow =
      selectedVetFilter === "all"
        ? settings.vets
        : settings.vets.filter((vet) => vet.id === selectedVetFilter);

    return vetsToShow
      .map((vet) => {
        const shift = resolveVetShift(vet, selectedDate, overrides);
        if (!shift.enabled) return null;

        return {
          vet,
          shift,
          slots: generateSlots(shift.start, shift.end, settings.slotMinutes),
        };
      })
      .filter(Boolean) as Array<{
      vet: AgendaSettings["vets"][number];
      shift: {
        enabled: boolean;
        start: string;
        end: string;
        breakStart: string;
        breakEnd: string;
      };
      slots: string[];
    }>;
  }, [settings, selectedDate, selectedVetFilter, overrides]);

  const stats = useMemo(() => {
    const active = dayAppointments.filter(appointmentIsActive);
    return {
      total: active.length,
      pending: active.filter((item) => item.status === "pending").length,
      confirmed: active.filter((item) => item.status === "confirmed").length,
      completed: active.filter((item) => item.status === "completed").length,
    };
  }, [dayAppointments]);

  function persistAppointments(next: AgendaAppointment[]) {
    setAppointments(next);
    saveAgendaAppointments(next);
  }

  function openCreateModal(startTime?: string, vetId?: string, roomId?: string) {
    if (!settings) return;

    setForm({
      id: null,
      date: selectedDate,
      startTime: startTime || "09:00",
      vetId: vetId || settings.vets[0]?.id || "",
      roomId: roomId || settings.rooms[0]?.id || "",
      animalId: "",
      animalName: "",
      ownerName: "",
      visitTypeId: settings.visitTypes[0]?.id || "",
      notes: "",
      status: "confirmed",
    });
    setIsModalOpen(true);
  }

  function openEditModal(appointment: AgendaAppointment) {
    setForm({
      id: appointment.id,
      date: appointment.date,
      startTime: appointment.startTime,
      vetId: appointment.vetId,
      roomId: appointment.roomId,
      animalId: appointment.animalId,
      animalName: appointment.animalName,
      ownerName: appointment.ownerName,
      visitTypeId: appointment.visitTypeId,
      notes: appointment.notes,
      status: appointment.status,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (!settings) return;
    setIsModalOpen(false);
    setForm({
      ...EMPTY_FORM,
      date: selectedDate,
      vetId: settings.vets[0]?.id || "",
      roomId: settings.rooms[0]?.id || "",
      visitTypeId: settings.visitTypes[0]?.id || "",
    });
  }

  function saveAppointment() {
    if (!settings) return;

    const vet = settings.vets.find((item) => item.id === form.vetId);
    const room = settings.rooms.find((item) => item.id === form.roomId);
    const visitType = settings.visitTypes.find((item) => item.id === form.visitTypeId);

    if (!vet || !room || !visitType || !form.animalName.trim() || !form.ownerName.trim()) {
      alert("Compila tutti i campi obbligatori.");
      return;
    }

    const shift = resolveVetShift(vet, form.date, overrides);
    if (!shift.enabled) {
      alert("Il veterinario non è in turno in questa data.");
      return;
    }

    const endTime = getEndTimeFromDuration(form.startTime, visitType.duration);

    if (form.startTime < shift.start || endTime > shift.end) {
      alert("L'appuntamento esce dal turno del veterinario.");
      return;
    }

    if (
      doesIntervalOverlap(form.startTime, endTime, shift.breakStart, shift.breakEnd) &&
      shift.breakStart !== "00:00" &&
      shift.breakEnd !== "00:00"
    ) {
      alert("L'appuntamento cade nella pausa del veterinario.");
      return;
    }

    const conflicting = appointments.some((item) => {
      if (item.date !== form.date) return false;
      if (!appointmentIsActive(item)) return false;
      if (form.id && item.id === form.id) return false;

      const sameVet = item.vetId === form.vetId;
      const sameRoom = item.roomId === form.roomId;

      if (!sameVet && !sameRoom) return false;

      return doesIntervalOverlap(form.startTime, endTime, item.startTime, item.endTime);
    });

    if (conflicting) {
      alert("C'è già un appuntamento sovrapposto su veterinario o stanza.");
      return;
    }

    const now = new Date().toISOString();

    if (form.id) {
      const updated = appointments.map((item) =>
        item.id === form.id
          ? {
              ...item,
              date: form.date,
              startTime: form.startTime,
              endTime,
              vetId: form.vetId,
              roomId: form.roomId,
              animalId: form.animalId.trim(),
              animalName: form.animalName.trim(),
              ownerName: form.ownerName.trim(),
              visitTypeId: visitType.id,
              visitTypeLabel: visitType.label,
              duration: visitType.duration,
              notes: form.notes.trim(),
              status: form.status,
              updatedAt: now,
            }
          : item
      );

      persistAppointments(updated);
      closeModal();
      return;
    }

    const newAppointment: AgendaAppointment = {
      id: crypto.randomUUID(),
      date: form.date,
      startTime: form.startTime,
      endTime,
      vetId: form.vetId,
      roomId: form.roomId,
      animalId: form.animalId.trim(),
      animalName: form.animalName.trim(),
      ownerName: form.ownerName.trim(),
      visitTypeId: visitType.id,
      visitTypeLabel: visitType.label,
      duration: visitType.duration,
      notes: form.notes.trim(),
      status: form.status,
      createdAt: now,
      updatedAt: now,
    };

    persistAppointments([...appointments, newAppointment]);
    closeModal();
  }

  function cancelAppointment(id: string) {
    const updated = appointments.map((item) =>
      item.id === id
        ? {
            ...item,
            status: "cancelled" as const,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    persistAppointments(updated);
  }

  function deleteAppointment(id: string) {
    const confirmed = window.confirm("Eliminare definitivamente questo appuntamento?");
    if (!confirmed) return;
    persistAppointments(appointments.filter((item) => item.id !== id));
  }

  if (!loaded || !settings) {
    return <div className="p-6 text-sm text-neutral-500">Caricamento agenda...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              UNIMALIA · Agenda
            </p>
            <h1 className="mt-1 text-3xl font-bold text-neutral-900">
              {settings.clinicName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-neutral-600">
              Agenda reale con turni settimanali, override per data, multi-slot per
              durata e gestione completa appuntamenti.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/professionisti/impostazioni/agenda"
              className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Impostazioni agenda
            </Link>

            <button
              onClick={() => openCreateModal()}
              className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Nuovo appuntamento
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Appuntamenti attivi
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.total}</div>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Confermati
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.confirmed}</div>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              In attesa
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.pending}</div>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Completati
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.completed}</div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm lg:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Veterinario
            </label>
            <select
              value={selectedVetFilter}
              onChange={(e) => setSelectedVetFilter(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="all">Tutti i veterinari</option>
              {settings.vets.map((vet) => (
                <option key={vet.id} value={vet.id}>
                  {vet.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Stanza
            </label>
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="all">Tutte le stanze</option>
              {settings.rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Giorno prima
            </button>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Giorno dopo
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Settimana corrente
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-7">
            {weekDates.map((date) => {
              const dayKey = DAY_LABELS.find((d) => d.key);
              const isSelected = date === selectedDate;
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-neutral-200 bg-neutral-50 hover:bg-white"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {new Date(`${date}T12:00:00`).toLocaleDateString("it-IT", {
                      weekday: "short",
                    })}
                  </div>
                  <div className="mt-1 text-sm font-bold text-neutral-900">{date}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Veterinari attivi il giorno selezionato
          </div>
          <div className="mt-2 text-sm text-neutral-600">{formatDateLabel(selectedDate)}</div>

          <div className="mt-4 flex flex-wrap gap-3">
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

        <div className="space-y-6">
          {slotsByVet.map(({ vet, shift, slots }) => {
            const roomsToShow =
              selectedRoomFilter === "all"
                ? settings.rooms
                : settings.rooms.filter((room) => room.id === selectedRoomFilter);

            return (
              <div
                key={vet.id}
                className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
              >
                <div className="border-b border-neutral-200 bg-neutral-100 px-5 py-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-lg font-bold text-neutral-900">{vet.name}</div>
                      <div className="text-sm text-neutral-600">
                        Turno {shift.start} - {shift.end} · pausa {shift.breakStart} -{" "}
                        {shift.breakEnd}
                      </div>
                    </div>

                    <div className="text-sm text-neutral-600">
                      {formatDateLabel(selectedDate)}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-white">
                      <tr>
                        <th className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                          Ora
                        </th>
                        {roomsToShow.map((room) => (
                          <th
                            key={room.id}
                            className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600"
                          >
                            {room.name}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {slots.map((slot) => (
                        <tr key={`${vet.id}-${slot}`} className="align-top hover:bg-neutral-50">
                          <td className="border-b border-neutral-100 px-4 py-4 text-sm font-semibold text-neutral-800">
                            {slot}
                          </td>

                          {roomsToShow.map((room) => {
                            const appointmentAtStart = visibleAppointments.find(
                              (item) =>
                                item.vetId === vet.id &&
                                item.roomId === room.id &&
                                appointmentStartsAtSlot(item, slot)
                            );

                            const coveredByAppointment = visibleAppointments.find(
                              (item) =>
                                item.vetId === vet.id &&
                                item.roomId === room.id &&
                                appointmentCoversSlot(item, slot)
                            );

                            const pause = isSlotInBreak(slot, shift);

                            if (pause) {
                              return (
                                <td
                                  key={`${vet.id}-${room.id}-${slot}`}
                                  className="border-b border-neutral-100 px-4 py-4"
                                >
                                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-800">
                                    Pausa
                                  </div>
                                </td>
                              );
                            }

                            if (appointmentAtStart) {
                              return (
                                <td
                                  key={`${vet.id}-${room.id}-${slot}`}
                                  className="border-b border-neutral-100 px-4 py-4"
                                >
                                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                                    <div className="text-sm font-bold text-neutral-900">
                                      {appointmentAtStart.animalName}
                                    </div>
                                    <div className="mt-1 text-xs text-neutral-600">
                                      Proprietario: {appointmentAtStart.ownerName}
                                    </div>
                                    <div className="mt-1 text-xs text-neutral-600">
                                      {appointmentAtStart.visitTypeLabel} ·{" "}
                                      {appointmentAtStart.startTime} - {appointmentAtStart.endTime}
                                    </div>
                                    <div className="mt-1 text-xs text-neutral-600">
                                      Stato: {appointmentAtStart.status}
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <button
                                        onClick={() => openEditModal(appointmentAtStart)}
                                        className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                                      >
                                        Modifica
                                      </button>

                                      <button
                                        onClick={() => cancelAppointment(appointmentAtStart.id)}
                                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                                      >
                                        Annulla
                                      </button>

                                      <button
                                        onClick={() => deleteAppointment(appointmentAtStart.id)}
                                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                      >
                                        Elimina
                                      </button>

                                      {appointmentAtStart.animalId ? (
                                        <Link
                                          href={`/professionisti/animali/${appointmentAtStart.animalId}`}
                                          className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                        >
                                          Scheda animale
                                        </Link>
                                      ) : null}
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            if (coveredByAppointment) {
                              return (
                                <td
                                  key={`${vet.id}-${room.id}-${slot}`}
                                  className="border-b border-neutral-100 px-4 py-4"
                                >
                                  <div className="rounded-2xl border border-neutral-200 bg-neutral-100 px-3 py-3 text-xs font-medium text-neutral-600">
                                    Occupato fino alle {coveredByAppointment.endTime}
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={`${vet.id}-${room.id}-${slot}`}
                                className="border-b border-neutral-100 px-4 py-4"
                              >
                                <button
                                  onClick={() => openCreateModal(slot, vet.id, room.id)}
                                  className="rounded-2xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                                >
                                  Prenota
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {slotsByVet.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500 shadow-sm">
              Nessun turno attivo per i filtri selezionati.
            </div>
          ) : null}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {form.id ? "Modifica appuntamento" : "Nuovo appuntamento"}
                </div>
                <h2 className="mt-1 text-2xl font-bold text-neutral-900">
                  {form.id ? "Aggiorna prenotazione" : "Crea prenotazione"}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Chiudi
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Data
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Ora inizio
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Veterinario
                </label>
                <select
                  value={form.vetId}
                  onChange={(e) => setForm((prev) => ({ ...prev, vetId: e.target.value }))}
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
                  Stanza
                </label>
                <select
                  value={form.roomId}
                  onChange={(e) => setForm((prev) => ({ ...prev, roomId: e.target.value }))}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                >
                  {settings.rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Prestazione
                </label>
                <select
                  value={form.visitTypeId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, visitTypeId: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                >
                  {settings.visitTypes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} · {item.duration} min
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Stato
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as AppointmentStatus,
                    }))
                  }
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="confirmed">confirmed</option>
                  <option value="pending">pending</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  ID animale
                </label>
                <input
                  value={form.animalId}
                  onChange={(e) => setForm((prev) => ({ ...prev, animalId: e.target.value }))}
                  placeholder="Facoltativo"
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Nome animale
                </label>
                <input
                  value={form.animalName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, animalName: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Proprietario
                </label>
                <input
                  value={form.ownerName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, ownerName: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-neutral-800">
                  Note
                </label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeModal}
                className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Annulla
              </button>

              <button
                onClick={saveAppointment}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {form.id ? "Salva modifiche" : "Conferma prenotazione"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}