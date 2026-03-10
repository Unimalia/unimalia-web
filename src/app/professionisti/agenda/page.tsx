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
  appointmentIsActive,
  appointmentStartsAtSlot,
  doesIntervalOverlap,
  formatDateLabel,
  generateSlots,
  getEndTimeFromDuration,
  getWeekDates,
  resolveVetShift,
  todayIsoLocal,
} from "@/lib/agenda/utils";

type AppointmentFormState = {
  id: string | null;
  date: string;
  startTime: string;
  vetId: string;
  assignedVetIds: string[];
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
  assignedVetIds: [],
  roomId: "",
  animalId: "",
  animalName: "",
  ownerName: "",
  visitTypeId: "",
  notes: "",
  status: "confirmed",
};

function normalizeAppointment(item: AgendaAppointment): AgendaAppointment {
  const assignedVetIds =
    Array.isArray(item.assignedVetIds) && item.assignedVetIds.length > 0
      ? item.assignedVetIds
      : item.vetId
      ? [item.vetId]
      : [];

  const assignedVetNames =
    Array.isArray(item.assignedVetNames) && item.assignedVetNames.length > 0
      ? item.assignedVetNames
      : item.vetName
      ? [item.vetName]
      : [];

  return {
    ...item,
    vetName: item.vetName || assignedVetNames[0] || "",
    roomName: item.roomName || "",
    assignedVetIds,
    assignedVetNames,
  };
}

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
    const loadedAppointments = loadAgendaAppointments().map(normalizeAppointment);

    setSettings(loadedSettings);
    setOverrides(loadedOverrides);
    setAppointments(loadedAppointments);
    setForm({
      ...EMPTY_FORM,
      date: todayIsoLocal(),
      vetId: loadedSettings.vets[0]?.id || "",
      assignedVetIds: loadedSettings.vets[0]?.id ? [loadedSettings.vets[0].id] : [],
      roomId: loadedSettings.rooms[0]?.id || "",
      visitTypeId: loadedSettings.visitTypes[0]?.id || "",
    });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen]);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const dayAppointments = useMemo(() => {
    return appointments.filter((item) => item.date === selectedDate);
  }, [appointments, selectedDate]);

  const visibleAppointments = useMemo(() => {
    return dayAppointments.filter((item) => {
      const vetOk =
        selectedVetFilter === "all" || item.assignedVetIds.includes(selectedVetFilter);
      const roomOk = selectedRoomFilter === "all" || item.roomId === selectedRoomFilter;
      return vetOk && roomOk;
    });
  }, [dayAppointments, selectedVetFilter, selectedRoomFilter]);

  const activeVetsForDay = useMemo(() => {
    if (!settings) return [];
    return settings.vets.filter((vet) => resolveVetShift(vet, selectedDate, overrides).enabled);
  }, [settings, selectedDate, overrides]);

  function getRoomById(roomId: string) {
    return settings?.rooms.find((room) => room.id === roomId) || null;
  }

  function isOperatingRoom(roomId: string) {
    const room = getRoomById(roomId);
    if (!room) return false;

    const name = room.name.trim().toLowerCase();
    return (
      name.includes("operatoria") ||
      name.includes("sala op") ||
      name.includes("chirurgia") ||
      name.includes("surgery")
    );
  }

  function isVetAvailableForInterval(
    vetId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string | null
  ) {
    if (!settings) return false;

    const vet = settings.vets.find((item) => item.id === vetId);
    if (!vet) return false;

    const shift = resolveVetShift(vet, date, overrides);
    if (!shift.enabled) return false;
    if (startTime < shift.start || endTime > shift.end) return false;

    if (
      shift.breakStart !== "00:00" &&
      shift.breakEnd !== "00:00" &&
      doesIntervalOverlap(startTime, endTime, shift.breakStart, shift.breakEnd)
    ) {
      return false;
    }

    const hasVetConflict = appointments.some((item) => {
      if (item.date !== date) return false;
      if (!appointmentIsActive(item)) return false;
      if (excludeAppointmentId && item.id === excludeAppointmentId) return false;
      if (!item.assignedVetIds.includes(vetId)) return false;

      return doesIntervalOverlap(startTime, endTime, item.startTime, item.endTime);
    });

    return !hasVetConflict;
  }

  function isRoomAvailableForInterval(
    roomId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string | null
  ) {
    const hasRoomConflict = appointments.some((item) => {
      if (item.date !== date) return false;
      if (!appointmentIsActive(item)) return false;
      if (excludeAppointmentId && item.id === excludeAppointmentId) return false;
      if (item.roomId !== roomId) return false;

      return doesIntervalOverlap(startTime, endTime, item.startTime, item.endTime);
    });

    return !hasRoomConflict;
  }

  function getSlotEndTime(slotTime: string) {
    const minutes = settings?.slotMinutes || 30;
    return getEndTimeFromDuration(slotTime, minutes);
  }

  function getActiveAppointmentForVetAtSlot(
    vetId: string,
    date: string,
    slotTime: string
  ) {
    const slotEnd = getSlotEndTime(slotTime);

    return appointments.find((item) => {
      if (item.date !== date) return false;
      if (!appointmentIsActive(item)) return false;
      if (!item.assignedVetIds.includes(vetId)) return false;

      return doesIntervalOverlap(slotTime, slotEnd, item.startTime, item.endTime);
    });
  }

  function getActiveAppointmentForRoomAtSlot(
    roomId: string,
    date: string,
    slotTime: string
  ) {
    const slotEnd = getSlotEndTime(slotTime);

    return appointments.find((item) => {
      if (item.date !== date) return false;
      if (!appointmentIsActive(item)) return false;
      if (item.roomId !== roomId) return false;

      return doesIntervalOverlap(slotTime, slotEnd, item.startTime, item.endTime);
    });
  }

  function isVetInShiftAtSlot(vetId: string, date: string, slotTime: string) {
    if (!settings) return false;

    const vet = settings.vets.find((item) => item.id === vetId);
    if (!vet) return false;

    const shift = resolveVetShift(vet, date, overrides);
    if (!shift.enabled) return false;

    const slotEnd = getSlotEndTime(slotTime);

    if (slotTime < shift.start || slotEnd > shift.end) return false;

    if (
      shift.breakStart !== "00:00" &&
      shift.breakEnd !== "00:00" &&
      doesIntervalOverlap(slotTime, slotEnd, shift.breakStart, shift.breakEnd)
    ) {
      return false;
    }

    return true;
  }

  function getSlotState(vetId: string, roomId: string, date: string, slotTime: string) {
    const vet = settings?.vets.find((item) => item.id === vetId);
    if (!vet) {
      return {
        type: "disabled" as const,
        label: "Non disponibile",
        appointment: null as AgendaAppointment | null,
      };
    }

    const shift = resolveVetShift(vet, date, overrides);
    const slotEnd = getSlotEndTime(slotTime);

    if (!shift.enabled || slotTime < shift.start || slotEnd > shift.end) {
      return {
        type: "offshift" as const,
        label: "Fuori turno",
        appointment: null as AgendaAppointment | null,
      };
    }

    if (
      shift.breakStart !== "00:00" &&
      shift.breakEnd !== "00:00" &&
      doesIntervalOverlap(slotTime, slotEnd, shift.breakStart, shift.breakEnd)
    ) {
      return {
        type: "break" as const,
        label: "Pausa",
        appointment: null as AgendaAppointment | null,
      };
    }

    const vetAppointment = getActiveAppointmentForVetAtSlot(vetId, date, slotTime);
    const roomAppointment = getActiveAppointmentForRoomAtSlot(roomId, date, slotTime);

    if (vetAppointment) {
      return {
        type: "busy-vet" as const,
        label:
          vetAppointment.roomId === roomId
            ? "Occupato"
            : `Occupato in ${vetAppointment.roomName || "altra stanza"}`,
        appointment: vetAppointment,
      };
    }

    if (roomAppointment) {
      return {
        type: "busy-room" as const,
        label: "Stanza occupata",
        appointment: roomAppointment,
      };
    }

    return {
      type: "available" as const,
      label: "Prenota",
      appointment: null as AgendaAppointment | null,
    };
  }

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

  const selectedVisitType = useMemo(() => {
    return settings?.visitTypes.find((item) => item.id === form.visitTypeId) || null;
  }, [settings, form.visitTypeId]);

  const formEndTime = useMemo(() => {
    const duration = selectedVisitType?.duration || settings?.slotMinutes || 30;
    return getEndTimeFromDuration(form.startTime, duration);
  }, [selectedVisitType, settings, form.startTime]);

  const isSurgeryRoomSelected = useMemo(() => {
    return isOperatingRoom(form.roomId);
  }, [form.roomId, settings]);

  const availableExtraVets = useMemo(() => {
    if (!settings || !isSurgeryRoomSelected) return [];

    return settings.vets.filter((vet) => {
      return isVetAvailableForInterval(
        vet.id,
        form.date,
        form.startTime,
        formEndTime,
        form.id
      );
    });
  }, [
    settings,
    isSurgeryRoomSelected,
    form.date,
    form.startTime,
    formEndTime,
    form.id,
    appointments,
    overrides,
  ]);

  useEffect(() => {
    if (!settings || !isModalOpen) return;

    if (!isSurgeryRoomSelected) {
      setForm((prev) => ({
        ...prev,
        assignedVetIds: prev.vetId ? [prev.vetId] : [],
      }));
      return;
    }

    const validIds = availableExtraVets.map((vet) => vet.id);

    setForm((prev) => {
      const cleaned = prev.assignedVetIds.filter((id) => validIds.includes(id));
      const primaryIncluded =
        prev.vetId && validIds.includes(prev.vetId) ? [prev.vetId] : [];
      const unique = Array.from(new Set([...primaryIncluded, ...cleaned]));

      return {
        ...prev,
        assignedVetIds: unique,
      };
    });
  }, [settings, isModalOpen, isSurgeryRoomSelected, availableExtraVets, form.vetId]);

  function persistAppointments(next: AgendaAppointment[]) {
    setAppointments(next);
    saveAgendaAppointments(next);
  }

  function openCreateModal(startTime?: string, vetId?: string, roomId?: string) {
    if (!settings) return;

    const nextStartTime = startTime || "09:00";
    const nextDate = selectedDate;
    const nextVetId = vetId || settings.vets[0]?.id || "";
    const nextRoomId = roomId || settings.rooms[0]?.id || "";
    const firstVisitTypeId = settings.visitTypes[0]?.id || "";

    setForm({
      id: null,
      date: nextDate,
      startTime: nextStartTime,
      vetId: nextVetId,
      assignedVetIds: nextVetId ? [nextVetId] : [],
      roomId: nextRoomId,
      animalId: "",
      animalName: "",
      ownerName: "",
      visitTypeId: firstVisitTypeId,
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
      assignedVetIds: appointment.assignedVetIds,
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
      assignedVetIds: settings.vets[0]?.id ? [settings.vets[0].id] : [],
      roomId: settings.rooms[0]?.id || "",
      visitTypeId: settings.visitTypes[0]?.id || "",
    });
  }

  function toggleAssignedVet(vetId: string) {
    setForm((prev) => {
      const exists = prev.assignedVetIds.includes(vetId);
      const next = exists
        ? prev.assignedVetIds.filter((id) => id !== vetId)
        : [...prev.assignedVetIds, vetId];

      const unique = Array.from(new Set(next));

      return {
        ...prev,
        assignedVetIds: unique,
        vetId: unique[0] || prev.vetId,
      };
    });
  }

  function saveAppointment() {
    if (!settings) return;

    const room = settings.rooms.find((item) => item.id === form.roomId);
    const visitType = settings.visitTypes.find((item) => item.id === form.visitTypeId);
    const primaryVet = settings.vets.find((item) => item.id === form.vetId);

    if (!room || !visitType || !primaryVet) {
      alert("Controlla stanza, prestazione e veterinario principale.");
      return;
    }

    if (!form.animalName.trim() || !form.ownerName.trim()) {
      alert("Inserisci nome animale e proprietario.");
      return;
    }

    const endTime = getEndTimeFromDuration(form.startTime, visitType.duration);
    const surgeryRoom = isOperatingRoom(form.roomId);

    const assignedVetIds = surgeryRoom
      ? Array.from(new Set(form.assignedVetIds.filter(Boolean)))
      : [form.vetId];

    if (assignedVetIds.length === 0) {
      alert("Seleziona almeno un veterinario.");
      return;
    }

    if (surgeryRoom && assignedVetIds.length < 2) {
      alert("In sala operatoria devi selezionare almeno due dottori.");
      return;
    }

    const unavailableVetNames: string[] = [];
    for (const vetId of assignedVetIds) {
      const ok = isVetAvailableForInterval(
        vetId,
        form.date,
        form.startTime,
        endTime,
        form.id
      );

      if (!ok) {
        const vet = settings.vets.find((item) => item.id === vetId);
        unavailableVetNames.push(vet?.name || "Veterinario");
      }
    }

    const roomAvailable = isRoomAvailableForInterval(
      form.roomId,
      form.date,
      form.startTime,
      endTime,
      form.id
    );

    if (unavailableVetNames.length > 0 && !roomAvailable) {
      alert(
        `I seguenti veterinari non sono disponibili in questa fascia: ${unavailableVetNames.join(
          ", "
        )}. Anche la stanza è già occupata in questo orario.`
      );
      return;
    }

    if (unavailableVetNames.length > 0) {
      alert(
        `I seguenti veterinari non sono disponibili in questa fascia: ${unavailableVetNames.join(
          ", "
        )}.`
      );
      return;
    }

    if (!roomAvailable) {
      alert("La stanza è già occupata in questa fascia oraria.");
      return;
    }

    const assignedVets = settings.vets.filter((vet) => assignedVetIds.includes(vet.id));
    const assignedVetNames = assignedVets.map((vet) => vet.name);
    const now = new Date().toISOString();

    if (form.id) {
      const updated = appointments.map((item) =>
        item.id === form.id
          ? {
              ...item,
              date: form.date,
              startTime: form.startTime,
              endTime,
              vetId: assignedVetIds[0],
              vetName: assignedVetNames[0] || "",
              assignedVetIds,
              assignedVetNames,
              roomId: room.id,
              roomName: room.name,
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
      vetId: assignedVetIds[0],
      vetName: assignedVetNames[0] || "",
      assignedVetIds,
      assignedVetNames,
      roomId: room.id,
      roomName: room.name,
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
    const confirmed = window.confirm("Vuoi eliminare definitivamente questo appuntamento?");
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
              Agenda clinica con turni, override, multi-slot e supporto sala operatoria con
              più dottori.
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

          <div className="flex items-end">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Giorno prima
            </button>
          </div>

          <div className="flex items-end">
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
                      <div className="mt-1 text-sm text-neutral-600">
                        Può lavorare nelle stanze disponibili, ma con una sola prenotazione
                        per fascia oraria.
                      </div>
                      <div className="mt-1 text-sm text-neutral-600">
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
                            const slotState = getSlotState(vet.id, room.id, selectedDate, slot);
                            const appointmentAtStart = visibleAppointments.find(
                              (item) =>
                                item.assignedVetIds.includes(vet.id) &&
                                item.roomId === room.id &&
                                appointmentStartsAtSlot(item, slot)
                            );

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
                                      {appointmentAtStart.startTime} -{" "}
                                      {appointmentAtStart.endTime}
                                    </div>

                                    <div className="mt-1 text-xs text-neutral-600">
                                      Durata: {appointmentAtStart.duration} min
                                    </div>

                                    <div className="mt-1 text-xs text-neutral-600">
                                      Medici: {appointmentAtStart.assignedVetNames.join(", ")}
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

                            if (slotState.type === "offshift") {
                              return (
                                <td
                                  key={`${vet.id}-${room.id}-${slot}`}
                                  className="border-b border-neutral-100 px-4 py-4"
                                >
                                  <div className="rounded-2xl border border-zinc-200 bg-zinc-100 px-3 py-3 text-xs font-semibold text-zinc-500">
                                    Fuori turno
                                  </div>
                                </td>
                              );
                            }

                            if (slotState.type === "break") {
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

                            if (slotState.type === "busy-vet") {
                              return (
                                <td
                                  key={`${vet.id}-${room.id}-${slot}`}
                                  className="border-b border-neutral-100 px-4 py-4"
                                >
                                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-3 text-xs font-semibold text-blue-800">
                                    {slotState.label}
                                  </div>
                                </td>
                              );
                            }

                            if (slotState.type === "busy-room") {
                              return (
                                <td
                                  key={`${vet.id}-${room.id}-${slot}`}
                                  className="border-b border-neutral-100 px-4 py-4"
                                >
                                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs font-semibold text-rose-800">
                                    Stanza occupata
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
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="flex h-full w-full items-start justify-center overflow-y-auto p-4 sm:items-center">
            <div className="my-4 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
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

              <div className="flex-1 overflow-y-auto px-6 py-5">
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
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-neutral-800">
                      Veterinario principale
                    </label>
                    <select
                      value={form.vetId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          vetId: e.target.value,
                          assignedVetIds: isOperatingRoom(prev.roomId)
                            ? Array.from(new Set([e.target.value, ...prev.assignedVetIds]))
                            : [e.target.value],
                        }))
                      }
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
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          roomId: e.target.value,
                          assignedVetIds: isOperatingRoom(e.target.value)
                            ? Array.from(
                                new Set(
                                  prev.assignedVetIds.length > 0
                                    ? prev.assignedVetIds
                                    : prev.vetId
                                    ? [prev.vetId]
                                    : []
                                )
                              )
                            : prev.vetId
                            ? [prev.vetId]
                            : [],
                        }))
                      }
                      className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    >
                      {settings.rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isSurgeryRoomSelected ? (
                    <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-sm font-bold text-neutral-900">
                        Sala operatoria · selezione multipla dottori
                      </div>
                      <div className="mt-1 text-sm text-neutral-600">
                        In questa stanza puoi assegnare più veterinari. Devono essere almeno
                        due.
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {availableExtraVets.map((vet) => {
                          const checked = form.assignedVetIds.includes(vet.id);

                          return (
                            <label
                              key={vet.id}
                              className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAssignedVet(vet.id)}
                              />
                              {vet.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

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
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, animalId: e.target.value }))
                      }
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

                  <div className="md:col-span-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="text-sm font-semibold text-neutral-900">Riepilogo slot</div>
                    <div className="mt-2 text-sm text-neutral-700">
                      {form.startTime} → {formEndTime} ·{" "}
                      {selectedVisitType?.duration || settings.slotMinutes} min
                    </div>
                    <div className="mt-1 text-sm text-neutral-700">
                      Stanza: {getRoomById(form.roomId)?.name || "-"}
                    </div>
                    <div className="mt-1 text-sm text-neutral-700">
                      Dottori selezionati:{" "}
                      {settings.vets
                        .filter((vet) => form.assignedVetIds.includes(vet.id))
                        .map((vet) => vet.name)
                        .join(", ") || "-"}
                    </div>
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
              </div>

              <div className="border-t border-neutral-200 px-6 py-5">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
          </div>
        </div>
      ) : null}
    </div>
  );
}