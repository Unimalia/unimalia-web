"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AgendaAppointment,
  AgendaSettings,
  AppointmentStatus,
  Vet,
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
  roomId: string;
  vetId: string;
  assignedVetIds: string[];
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
  roomId: "",
  vetId: "",
  assignedVetIds: [],
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
    assignedVetIds,
    assignedVetNames,
    vetName: item.vetName || assignedVetNames[0] || "",
    roomName: item.roomName || "",
  };
}

type SlotState =
  | { type: "available"; label: string }
  | { type: "offshift"; label: string }
  | { type: "break"; label: string }
  | { type: "busy-room"; label: string; appointment: AgendaAppointment }
  | { type: "busy-vet"; label: string; appointment: AgendaAppointment }
  | { type: "busy-start"; label: string; appointment: AgendaAppointment };

export default function AgendaPage() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<AgendaSettings | null>(null);
  const [overrides, setOverrides] = useState<VetScheduleOverride[]>([]);
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIsoLocal());
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("all");
  const [selectedVetFilter, setSelectedVetFilter] = useState("all");
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
      roomId: loadedSettings.rooms[0]?.id || "",
      vetId: loadedSettings.vets[0]?.id || "",
      assignedVetIds: loadedSettings.vets[0]?.id ? [loadedSettings.vets[0].id] : [],
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

  const activeAppointmentsForDay = useMemo(() => {
    return appointments.filter(
      (item) => item.date === selectedDate && appointmentIsActive(item)
    );
  }, [appointments, selectedDate]);

  const selectedVisitType = useMemo(() => {
    return settings?.visitTypes.find((item) => item.id === form.visitTypeId) || null;
  }, [settings, form.visitTypeId]);

  const formEndTime = useMemo(() => {
    const duration = selectedVisitType?.duration || settings?.slotMinutes || 30;
    return getEndTimeFromDuration(form.startTime, duration);
  }, [selectedVisitType, settings, form.startTime]);

  const visibleRooms = useMemo(() => {
    if (!settings) return [];
    return selectedRoomFilter === "all"
      ? settings.rooms
      : settings.rooms.filter((room) => room.id === selectedRoomFilter);
  }, [settings, selectedRoomFilter]);

  const visibleVets = useMemo(() => {
    if (!settings) return [];
    return selectedVetFilter === "all"
      ? settings.vets
      : settings.vets.filter((vet) => vet.id === selectedVetFilter);
  }, [settings, selectedVetFilter]);

  const timelineStart = useMemo(() => {
    if (!settings || settings.vets.length === 0) return "08:00";

    const starts = settings.vets
      .map((vet) => resolveVetShift(vet, selectedDate, overrides))
      .filter((shift) => shift.enabled)
      .map((shift) => shift.start)
      .sort();

    return starts[0] || "08:00";
  }, [settings, selectedDate, overrides]);

  const timelineEnd = useMemo(() => {
    if (!settings || settings.vets.length === 0) return "20:00";

    const ends = settings.vets
      .map((vet) => resolveVetShift(vet, selectedDate, overrides))
      .filter((shift) => shift.enabled)
      .map((shift) => shift.end)
      .sort();

    return ends[ends.length - 1] || "20:00";
  }, [settings, selectedDate, overrides]);

  const timeSlots = useMemo(() => {
    if (!settings) return [];
    return generateSlots(timelineStart, timelineEnd, settings.slotMinutes);
  }, [settings, timelineStart, timelineEnd]);

  const activeVetsForDay = useMemo(() => {
    if (!settings) return [];
    return settings.vets.filter((vet) => resolveVetShift(vet, selectedDate, overrides).enabled);
  }, [settings, selectedDate, overrides]);

  function persistAppointments(next: AgendaAppointment[]) {
    setAppointments(next);
    saveAgendaAppointments(next);
  }

  function getRoomById(roomId: string) {
    return settings?.rooms.find((room) => room.id === roomId) || null;
  }

  function getVetById(vetId: string) {
    return settings?.vets.find((vet) => vet.id === vetId) || null;
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

  function getSlotEndTime(slotTime: string) {
    return getEndTimeFromDuration(slotTime, settings?.slotMinutes || 30);
  }

  function getAppointmentStartingInRoomAtSlot(
    roomId: string,
    date: string,
    slotTime: string
  ) {
    return appointments.find((item) => {
      if (item.date !== date) return false;
      if (!appointmentIsActive(item)) return false;
      if (item.roomId !== roomId) return false;
      return item.startTime === slotTime;
    });
  }

  function getAppointmentCoveringRoomAtSlot(
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

  function getAppointmentCoveringVetAtSlot(
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

  function getShiftSlotStatus(vet: Vet, slotTime: string) {
    const shift = resolveVetShift(vet, selectedDate, overrides);
    const slotEnd = getSlotEndTime(slotTime);

    if (!shift.enabled || slotTime < shift.start || slotEnd > shift.end) {
      return "offshift" as const;
    }

    if (
      shift.breakStart !== "00:00" &&
      shift.breakEnd !== "00:00" &&
      doesIntervalOverlap(slotTime, slotEnd, shift.breakStart, shift.breakEnd)
    ) {
      return "break" as const;
    }

    return "inshift" as const;
  }

  function getAvailableVetsForRoomSlot(roomId: string, slotTime: string, excludeAppointmentId?: string | null) {
    if (!settings) return [];

    const slotEnd = getSlotEndTime(slotTime);

    return visibleVets.filter((vet) => {
      const shiftState = getShiftSlotStatus(vet, slotTime);
      if (shiftState !== "inshift") return false;

      const hasConflict = appointments.some((item) => {
        if (item.date !== selectedDate) return false;
        if (!appointmentIsActive(item)) return false;
        if (excludeAppointmentId && item.id === excludeAppointmentId) return false;
        if (!item.assignedVetIds.includes(vet.id)) return false;

        return doesIntervalOverlap(slotTime, slotEnd, item.startTime, item.endTime);
      });

      return !hasConflict;
    });
  }

  function getSlotState(roomId: string, slotTime: string): SlotState {
    if (!settings) {
      return { type: "offshift", label: "Non disponibile" };
    }

    const appointmentStart = getAppointmentStartingInRoomAtSlot(roomId, selectedDate, slotTime);
    if (appointmentStart) {
      return {
        type: "busy-start",
        label: "Occupato",
        appointment: appointmentStart,
      };
    }

    const roomAppointment = getAppointmentCoveringRoomAtSlot(roomId, selectedDate, slotTime);
    if (roomAppointment) {
      return {
        type: "busy-room",
        label: "Stanza occupata",
        appointment: roomAppointment,
      };
    }

    const availableVets = getAvailableVetsForRoomSlot(roomId, slotTime);
    if (availableVets.length === 0) {
      const anyInBreak = visibleVets.some((vet) => getShiftSlotStatus(vet, slotTime) === "break");
      const anyInShift = visibleVets.some((vet) => getShiftSlotStatus(vet, slotTime) === "inshift");

      if (anyInBreak) {
        return { type: "break", label: "Pausa" };
      }

      if (!anyInShift) {
        return { type: "offshift", label: "Fuori turno" };
      }

      return { type: "busy-vet", label: "Veterinari occupati", appointment: roomAppointment as any };
    }

    return { type: "available", label: "Prenota" };
  }

  function openCreateModal(startTime?: string, roomId?: string) {
    if (!settings) return;

    const nextDate = selectedDate;
    const nextStartTime = startTime || timeSlots[0] || "09:00";
    const nextRoomId = roomId || settings.rooms[0]?.id || "";
    const nextVisitTypeId = settings.visitTypes[0]?.id || "";
    const vets = getAvailableVetsForRoomSlot(nextRoomId, nextStartTime);

    setForm({
      id: null,
      date: nextDate,
      startTime: nextStartTime,
      roomId: nextRoomId,
      vetId: vets[0]?.id || "",
      assignedVetIds: vets[0]?.id ? [vets[0].id] : [],
      animalId: "",
      animalName: "",
      ownerName: "",
      visitTypeId: nextVisitTypeId,
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
      roomId: appointment.roomId,
      vetId: appointment.vetId,
      assignedVetIds: appointment.assignedVetIds,
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
      roomId: settings.rooms[0]?.id || "",
      vetId: settings.vets[0]?.id || "",
      assignedVetIds: settings.vets[0]?.id ? [settings.vets[0].id] : [],
      visitTypeId: settings.visitTypes[0]?.id || "",
    });
  }

  const availableVetsForForm = useMemo(() => {
    if (!settings || !form.roomId || !form.startTime) return [];
    return settings.vets.filter((vet) => {
      const shift = resolveVetShift(vet, form.date, overrides);
      if (!shift.enabled) return false;
      if (form.startTime < shift.start || formEndTime > shift.end) return false;

      if (
        shift.breakStart !== "00:00" &&
        shift.breakEnd !== "00:00" &&
        doesIntervalOverlap(form.startTime, formEndTime, shift.breakStart, shift.breakEnd)
      ) {
        return false;
      }

      const hasConflict = appointments.some((item) => {
        if (item.date !== form.date) return false;
        if (!appointmentIsActive(item)) return false;
        if (form.id && item.id === form.id) return false;
        if (!item.assignedVetIds.includes(vet.id)) return false;

        return doesIntervalOverlap(form.startTime, formEndTime, item.startTime, item.endTime);
      });

      return !hasConflict;
    });
  }, [settings, form.date, form.startTime, formEndTime, form.id, appointments, overrides, form.roomId]);

  const isSurgeryRoomSelected = useMemo(() => {
    return isOperatingRoom(form.roomId);
  }, [form.roomId, settings]);

  useEffect(() => {
    if (!isModalOpen) return;

    if (!isSurgeryRoomSelected) {
      const stillValid = availableVetsForForm.some((vet) => vet.id === form.vetId);
      const nextPrimary = stillValid ? form.vetId : availableVetsForForm[0]?.id || "";

      setForm((prev) => ({
        ...prev,
        vetId: nextPrimary,
        assignedVetIds: nextPrimary ? [nextPrimary] : [],
      }));
      return;
    }

    const validIds = availableVetsForForm.map((vet) => vet.id);
    setForm((prev) => {
      const cleaned = prev.assignedVetIds.filter((id) => validIds.includes(id));
      const nextPrimary =
        validIds.includes(prev.vetId) ? prev.vetId : cleaned[0] || validIds[0] || "";

      const withPrimary = nextPrimary
        ? Array.from(new Set([nextPrimary, ...cleaned]))
        : cleaned;

      return {
        ...prev,
        vetId: nextPrimary,
        assignedVetIds: withPrimary,
      };
    });
  }, [isModalOpen, isSurgeryRoomSelected, availableVetsForForm, form.vetId]);

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

    const room = getRoomById(form.roomId);
    const visitType = settings.visitTypes.find((item) => item.id === form.visitTypeId);

    if (!room || !visitType) {
      alert("Controlla stanza e prestazione.");
      return;
    }

    if (!form.animalName.trim() || !form.ownerName.trim()) {
      alert("Inserisci nome animale e proprietario.");
      return;
    }

    const isSurgery = isOperatingRoom(form.roomId);
    const assignedVetIds = isSurgery
      ? Array.from(new Set(form.assignedVetIds.filter(Boolean)))
      : form.vetId
      ? [form.vetId]
      : [];

    if (assignedVetIds.length === 0) {
      alert("Seleziona almeno un veterinario.");
      return;
    }

    if (isSurgery && assignedVetIds.length < 2) {
      alert("In sala operatoria devi selezionare almeno due dottori.");
      return;
    }

    const roomConflict = appointments.some((item) => {
      if (item.date !== form.date) return false;
      if (!appointmentIsActive(item)) return false;
      if (form.id && item.id === form.id) return false;
      if (item.roomId !== form.roomId) return false;

      return doesIntervalOverlap(form.startTime, formEndTime, item.startTime, item.endTime);
    });

    if (roomConflict) {
      alert("La stanza è già occupata in questa fascia oraria.");
      return;
    }

    const unavailableVetNames: string[] = [];

    for (const vetId of assignedVetIds) {
      const vet = getVetById(vetId);
      if (!vet) continue;

      const shift = resolveVetShift(vet, form.date, overrides);

      if (!shift.enabled || form.startTime < shift.start || formEndTime > shift.end) {
        unavailableVetNames.push(vet.name);
        continue;
      }

      if (
        shift.breakStart !== "00:00" &&
        shift.breakEnd !== "00:00" &&
        doesIntervalOverlap(form.startTime, formEndTime, shift.breakStart, shift.breakEnd)
      ) {
        unavailableVetNames.push(vet.name);
        continue;
      }

      const hasConflict = appointments.some((item) => {
        if (item.date !== form.date) return false;
        if (!appointmentIsActive(item)) return false;
        if (form.id && item.id === form.id) return false;
        if (!item.assignedVetIds.includes(vetId)) return false;

        return doesIntervalOverlap(form.startTime, formEndTime, item.startTime, item.endTime);
      });

      if (hasConflict) {
        unavailableVetNames.push(vet.name);
      }
    }

    if (unavailableVetNames.length > 0) {
      alert(
        `I seguenti veterinari non sono disponibili in questa fascia: ${unavailableVetNames.join(
          ", "
        )}.`
      );
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
              endTime: formEndTime,
              roomId: room.id,
              roomName: room.name,
              vetId: assignedVetIds[0],
              vetName: assignedVetNames[0] || "",
              assignedVetIds,
              assignedVetNames,
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
      endTime: formEndTime,
      roomId: room.id,
      roomName: room.name,
      vetId: assignedVetIds[0],
      vetName: assignedVetNames[0] || "",
      assignedVetIds,
      assignedVetNames,
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

  const stats = useMemo(() => {
    return {
      total: activeAppointmentsForDay.length,
      rooms: visibleRooms.length,
      vets: activeVetsForDay.length,
      surgeries: activeAppointmentsForDay.filter((item) =>
        isOperatingRoom(item.roomId)
      ).length,
    };
  }, [activeAppointmentsForDay, visibleRooms.length, activeVetsForDay.length, settings]);

  if (!loaded || !settings) {
    return <div className="p-6 text-sm text-neutral-500">Caricamento agenda...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              UNIMALIA · Agenda clinica
            </p>
            <h1 className="mt-1 text-3xl font-bold text-neutral-900">
              {settings.clinicName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-neutral-600">
              Agenda stanza-centrica con disponibilità veterinari, turni, pausa e
              supporto sala operatoria multi-dottore.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/professionisti/impostazioni/agenda"
              className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Gestione turni e agenda
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
              Stanze visibili
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.rooms}</div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Veterinari in turno
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.vets}</div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Chirurgie del giorno
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">{stats.surgeries}</div>
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
            Disponibilità del giorno
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

        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    Ora
                  </th>
                  {visibleRooms.map((room) => (
                    <th
                      key={room.id}
                      className="border-b border-neutral-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600"
                    >
                      <div>{room.name}</div>
                      <div className="mt-1 text-[11px] font-medium normal-case tracking-normal text-neutral-500">
                        {isOperatingRoom(room.id)
                          ? "Multi-veterinario"
                          : "1 veterinario per fascia"}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot} className="align-top hover:bg-neutral-50">
                    <td className="border-b border-neutral-100 px-4 py-4 text-sm font-semibold text-neutral-800">
                      {slot}
                    </td>

                    {visibleRooms.map((room) => {
                      const slotState = getSlotState(room.id, slot);

                      if (slotState.type === "busy-start") {
                        const appointment = slotState.appointment;

                        return (
                          <td
                            key={`${room.id}-${slot}`}
                            className="border-b border-neutral-100 px-4 py-4"
                          >
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                              <div className="text-sm font-bold text-neutral-900">
                                {appointment.animalName}
                              </div>
                              <div className="mt-1 text-xs text-neutral-600">
                                Proprietario: {appointment.ownerName}
                              </div>
                              <div className="mt-1 text-xs text-neutral-600">
                                {appointment.visitTypeLabel} · {appointment.startTime} -{" "}
                                {appointment.endTime}
                              </div>
                              <div className="mt-1 text-xs text-neutral-600">
                                Durata: {appointment.duration} min
                              </div>
                              <div className="mt-1 text-xs text-neutral-600">
                                Medici: {appointment.assignedVetNames.join(", ")}
                              </div>
                              <div className="mt-1 text-xs text-neutral-600">
                                Stato: {appointment.status}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  onClick={() => openEditModal(appointment)}
                                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                                >
                                  Modifica
                                </button>

                                <button
                                  onClick={() => cancelAppointment(appointment.id)}
                                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                                >
                                  Annulla
                                </button>

                                <button
                                  onClick={() => deleteAppointment(appointment.id)}
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                >
                                  Elimina
                                </button>

                                {appointment.animalId ? (
                                  <Link
                                    href={`/professionisti/animali/${appointment.animalId}`}
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

                      if (slotState.type === "busy-room") {
                        return (
                          <td
                            key={`${room.id}-${slot}`}
                            className="border-b border-neutral-100 px-4 py-4"
                          >
                            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-3 text-xs font-semibold text-blue-800">
                              Stanza occupata
                            </div>
                          </td>
                        );
                      }

                      if (slotState.type === "busy-vet") {
                        return (
                          <td
                            key={`${room.id}-${slot}`}
                            className="border-b border-neutral-100 px-4 py-4"
                          >
                            <div className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-3 text-xs font-semibold text-violet-800">
                              Veterinari occupati
                            </div>
                          </td>
                        );
                      }

                      if (slotState.type === "break") {
                        return (
                          <td
                            key={`${room.id}-${slot}`}
                            className="border-b border-neutral-100 px-4 py-4"
                          >
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-800">
                              Pausa
                            </div>
                          </td>
                        );
                      }

                      if (slotState.type === "offshift") {
                        return (
                          <td
                            key={`${room.id}-${slot}`}
                            className="border-b border-neutral-100 px-4 py-4"
                          >
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-100 px-3 py-3 text-xs font-semibold text-zinc-500">
                              Fuori turno
                            </div>
                          </td>
                        );
                      }

                      const availableVets = getAvailableVetsForRoomSlot(room.id, slot);

                      return (
                        <td
                          key={`${room.id}-${slot}`}
                          className="border-b border-neutral-100 px-4 py-4"
                        >
                          <div className="space-y-2">
                            <button
                              onClick={() => openCreateModal(slot, room.id)}
                              className="rounded-2xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                            >
                              Prenota
                            </button>

                            <div className="text-[11px] text-neutral-500">
                              Disponibili:{" "}
                              {availableVets.length > 0
                                ? availableVets.map((vet) => vet.name).join(", ")
                                : "nessuno"}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, date: e.target.value }))
                      }
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
                      {availableVetsForForm.map((vet) => (
                        <option key={vet.id} value={vet.id}>
                          {vet.name}
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
                        In questa stanza puoi assegnare più veterinari. Devono essere
                        almeno due.
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {availableVetsForForm.map((vet) => {
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
                    <div className="text-sm font-semibold text-neutral-900">
                      Riepilogo slot
                    </div>
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
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
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