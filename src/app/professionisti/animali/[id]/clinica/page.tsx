"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isVetUser } from "@/app/professionisti/_components/ProShell";
import { authHeaders } from "@/lib/client/authHeaders";

type ClinicEventType =
  | "visit"
  | "vaccine"
  | "therapy"
  | "exam"
  | "surgery"
  | "note"
  | "chronic_condition"
  | "follow_up"
  | "imaging";

type ClinicEventRow = {
  id: string;
  animal_id: string;
  event_date: string;
  type: ClinicEventType;
  title: string;
  description: string | null;
  visibility: "owner" | "professionals" | "emergency";
  source: "owner" | "professional" | "veterinarian";
  verified_at: string | null;
  verified_by: string | null;
  created_by?: string | null;
  created_by_label?: string | null;
  created_at?: string | null;
  verified_by_label?: string | null;
  verified_by_org_id?: string | null;
  verified_by_member_id?: string | null;
  meta?: any;
};

type VetOption = {
  id: string;
  label: string;
};

type AnimalSummary = {
  id: string;
  name: string | null;
  species: string | null;
  breed: string | null;
  chip_number?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  owner_first_name?: string | null;
  owner_last_name?: string | null;
};

type FilterKey =
  | "all"
  | "visit"
  | "vaccine"
  | "exam"
  | "therapy"
  | "note"
  | "document"
  | "emergency"
  | "weight"
  | "allergy"
  | "feeding"
  | "surgery"
  | "chronic_condition"
  | "follow_up"
  | "imaging";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tutti" },
  { key: "visit", label: "Visite" },
  { key: "vaccine", label: "Vaccini" },
  { key: "exam", label: "Esami" },
  { key: "imaging", label: "Imaging" },
  { key: "therapy", label: "Terapie" },
  { key: "chronic_condition", label: "Patologie croniche" },
  { key: "follow_up", label: "Ricontrolli" },
  { key: "surgery", label: "Chirurgia" },
  { key: "allergy", label: "Allergie" },
  { key: "feeding", label: "Alimentazione" },
  { key: "note", label: "Note" },
  { key: "document", label: "Documenti" },
  { key: "emergency", label: "Emergenze" },
  { key: "weight", label: "Peso" },
];

function typeLabel(t: ClinicEventType) {
  switch (t) {
    case "visit":
      return "Visita";
    case "vaccine":
      return "Vaccinazione";
    case "exam":
      return "Esame";
    case "therapy":
      return "Terapia";
    case "chronic_condition":
      return "Patologia cronica";
    case "follow_up":
      return "Ricontrollo";
    case "note":
      return "Nota";
    case "surgery":
      return "Intervento chirurgico";
    case "imaging":
      return "Imaging";
    default:
      return t;
  }
}

function typeIcon(t: ClinicEventType | string) {
  switch (t) {
    case "visit":
      return "🩺";
    case "vaccine":
      return "💉";
    case "exam":
      return "🔬";
    case "therapy":
      return "💊";
    case "surgery":
      return "🏥";
    case "note":
      return "📝";
    case "chronic_condition":
      return "📌";
    case "follow_up":
      return "🔁";
    case "imaging":
      return "🖼️";
    default:
      return "📄";
  }
}

function eventTypeDisplay(t: ClinicEventType | string) {
  return `${typeIcon(t)} ${typeLabel(t as ClinicEventType)}`;
}

const DOG_VACCINES = [
  { value: "rabies", label: "Rabbia" },
  { value: "dhpp", label: "Cimurro / Epatite / Parvo" },
  { value: "leptospirosis", label: "Leptospirosi" },
  { value: "bordetella", label: "Tosse dei canili" },
  { value: "leishmania", label: "Leishmaniosi" },
];

const CAT_VACCINES = [
  { value: "rcp", label: "Trivalente (RCP)" },
  { value: "felv", label: "Leucemia felina" },
  { value: "rabies", label: "Rabbia" },
  { value: "chlamydia", label: "Clamidia" },
];

function isCatSpecies(species?: string | null) {
  const s = String(species || "").trim().toLowerCase();
  return s === "cat" || s === "gatto";
}

function visibilityLabel(value: "owner" | "professionals" | "emergency" | string) {
  switch (value) {
    case "owner":
      return "Privato";
    case "professionals":
      return "Professionisti";
    case "emergency":
      return "Emergenza";
    default:
      return value;
  }
}

function formatDateIT(iso: string) {
  try {
    const s = String(iso || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-").map((x) => Number(x));
      const dt = new Date(y, (m || 1) - 1, d || 1);
      return dt.toLocaleDateString("it-IT", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }
    return new Date(s).toLocaleString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatEventDateIT(dateStr?: string | null) {
  if (!dateStr) return "—";
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
  return new Date(s).toLocaleDateString("it-IT");
}

function formatInsertedAtIT(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayGroupLabel(dateStr?: string | null) {
  if (!dateStr) return "Data non disponibile";
  const s = String(dateStr).trim();
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    return new Date(s).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function normalizeChip(raw?: string | null) {
  return String(raw || "").replace(/\s+/g, "").trim();
}

function extractWeightKg(e: any): number | null {
  if (!e) return null;
  const direct =
    e.weight_kg ??
    e.weightKg ??
    e?.meta?.weight_kg ??
    e?.meta?.weightKg ??
    e?.data?.weightKg ??
    e?.data?.weight_kg ??
    e?.payload?.weightKg ??
    e?.payload?.weight_kg;
  if (direct === null || direct === undefined) return null;
  const n = typeof direct === "number" ? direct : Number(String(direct).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 10) / 10;
}

function extractTherapyStartDate(e: any): string | null {
  return e?.meta?.therapy_start_date || null;
}

function extractTherapyEndDate(e: any): string | null {
  return e?.meta?.therapy_end_date || null;
}

function formatWeightLabel(kg: number) {
  return Number.isInteger(kg) ? `${kg} kg` : `${kg} kg`;
}

function getEventAuthorLabel(ev: ClinicEventRow) {
  const vet = ev?.meta?.created_by_member_label || ev.created_by_label || ev.verified_by_label || "";
  const clinic = ev?.meta?.created_by_org_name || ev?.meta?.org_name || "";
  if (vet && clinic) return `${vet} – ${clinic}`;
  if (vet) return vet;
  if (clinic) return clinic;
  if (ev.source === "owner") return "Proprietario";
  if (ev.source === "veterinarian") return "Veterinario";
  return "Clinica";
}

const FIELD_LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700";
const FIELD_CLASS =
  "mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20";
const TEXTAREA_CLASS =
  "mt-1 min-h-[120px] w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20";
const FILE_INPUT_CLASS =
  "block w-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3.5 py-3 text-sm text-zinc-700 file:mr-3 file:rounded-xl file:border-0 file:bg-black file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-zinc-400 focus-within:border-zinc-500 focus-within:ring-4 focus-within:ring-zinc-200";

export default function ClinicaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [isVet, setIsVet] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [animal, setAnimal] = useState<AnimalSummary | null>(null);
  const [animalSpecies, setAnimalSpecies] = useState<string | null>(null);

  const [eventsLoading, setEventsLoading] = useState(false);
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [eventsErr, setEventsErr] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [vetFilter, setVetFilter] = useState("all");

  const PAGE_SIZE = 50;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  const [newType, setNewType] = useState<ClinicEventType>("visit");
  const [newDate, setNewDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [newWeightKg, setNewWeightKg] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newVetSignature, setNewVetSignature] = useState<string>("");
  const [newImagingModality, setNewImagingModality] = useState<string>("RX");
  const [newImagingBodyPart, setNewImagingBodyPart] = useState<string>("");
  const [vetOptions] = useState<VetOption[]>([]);
  const [selectedVetId] = useState<string>("");

  const [therapyStartDate, setTherapyStartDate] = useState("");
  const [therapyEndDate, setTherapyEndDate] = useState("");
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>([]);
  const [vaccineBatch, setVaccineBatch] = useState("");
  const [vaccineNextDue, setVaccineNextDue] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkVerifying, setBulkVerifying] = useState(false);

  const [detailEvent, setDetailEvent] = useState<ClinicEventRow | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [detailFilesLoading, setDetailFilesLoading] = useState(false);
  const [filesCountByEventId, setFilesCountByEventId] = useState<Record<string, number>>({});

  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<ClinicEventType>("visit");
  const [editDate, setEditDate] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTherapyStartDate, setEditTherapyStartDate] = useState("");
  const [editTherapyEndDate, setEditTherapyEndDate] = useState("");
  const [modalErr, setModalErr] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [remindAt, setRemindAt] = useState<string>("");
  const [remindEmail, setRemindEmail] = useState(true);
  const [reminderPresetDays, setReminderPresetDays] = useState<number | null>(null);

  function toggleSelectedVaccine(value: string) {
    setSelectedVaccines((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        router.replace(
          "/professionisti/login?next=" +
            encodeURIComponent(`/professionisti/animali/${id}/clinica`)
        );
        return;
      }
      setIsVet(isVetUser(user));
      setCurrentUserId(user.id);
    })();
  }, [id, router]);

  async function loadClinicEvents() {
    if (!id) return;
    setEventsLoading(true);
    setEventsErr(null);
    try {
      const res = await fetch(`/api/clinic-events/list?animalId=${encodeURIComponent(id)}`, {
        cache: "no-store",
        headers: {
          ...(await authHeaders()),
        },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setEvents([]);
          setEventsErr("Cartella clinica: accesso riservato ai veterinari autorizzati.");
          setEventsLoading(false);
          return;
        }
        setEvents([]);
        setEventsErr("Impossibile caricare la cartella clinica (errore server).");
        setEventsLoading(false);
        return;
      }
      const json = await res.json().catch(() => ({}));
      setEvents((json?.events as ClinicEventRow[]) ?? []);
    } catch {
      setEvents([]);
      setEventsErr("Errore di rete durante il caricamento eventi.");
    } finally {
      setEventsLoading(false);
    }
  }

  async function loadAnimal() {
    if (!id) return;
    try {
      const res = await fetch(`/api/professionisti/animal?animalId=${encodeURIComponent(id)}`, {
        cache: "no-store",
        headers: {
          ...(await authHeaders()),
        },
      });
      if (!res.ok) return;
      const json = await res.json().catch(() => ({}));
      const a = json?.animal || null;
      setAnimal(
        a
          ? {
              id: a.id,
              name: a.name ?? null,
              species: a.species ?? null,
              breed: a.breed ?? null,
              chip_number: a.chip_number ?? a.chip_code ?? null,
              owner_name: a.owner_name ?? null,
              owner_email: a.owner_email ?? null,
              owner_phone: a.owner_phone ?? null,
              owner_first_name: a.owner_first_name ?? null,
              owner_last_name: a.owner_last_name ?? null,
            }
          : null
      );
      setAnimalSpecies(a?.species || null);
    } catch {
      // ignore
    }
  }

  async function loadFilesCount() {
    if (!id) return;
    try {
      const res = await fetch(`/api/clinic-events/files/count?animalId=${encodeURIComponent(id)}`, {
        cache: "no-store",
        headers: { ...(await authHeaders()) },
      });
      if (!res.ok) return;
      const json = await res.json().catch(() => ({}));
      const counts = (json?.counts as Record<string, number>) ?? {};
      setFilesCountByEventId(counts);
    } catch {
      // no-op
    }
  }

  async function openImagingFile(eventId: string, filePath: string) {
    try {
      const res = await fetch("/api/clinic/imaging/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          eventId,
          filePath,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.url) {
        alert(json?.error || "Impossibile aprire il file imaging.");
        return;
      }

      window.open(json.url, "_blank", "noopener,noreferrer");
    } catch {
      alert("Errore di rete durante l'apertura del file imaging.");
    }
  }

  useEffect(() => {
    if (!id) return;
    void (async () => {
      await loadAnimal();
      await loadClinicEvents();
      await loadFilesCount();
    })();
  }, [id]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, events.length, search, vetFilter]);

  useEffect(() => {
    if (!detailEvent) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detailEvent]);

  useEffect(() => {
    if (!detailEvent?.id) return;
    const eventId = detailEvent.id;
    setDetailFiles([]);
    setDetailFilesLoading(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/clinic-events/files/list?eventId=${encodeURIComponent(eventId)}`,
          {
            cache: "no-store",
            headers: {
              ...(await authHeaders()),
            },
          }
        );
        const j = await res.json().catch(() => ({}));
        setDetailFiles((j?.files as any[]) ?? []);
        setFilesCountByEventId((prev) => ({ ...prev, [eventId]: j?.files?.length ?? 0 }));
      } catch {
        setDetailFiles([]);
      } finally {
        setDetailFilesLoading(false);
      }
    })();
  }, [detailEvent?.id]);

  function addDaysISO(fromISO: string, days: number) {
    const base = new Date(fromISO || new Date().toISOString());
    base.setDate(base.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
  }

  const showRecallQuickActions = newType === "vaccine" || newType === "visit";

  function onSuggestRecall(days: number) {
    setReminderEnabled(true);
    setReminderPresetDays(days);
    setRemindAt(addDaysISO(newDate, days));
  }

  async function saveClinicEvent() {
    if (!id) return;
    setSaving(true);
    setSaveErr(null);
    setSaveOk(null);

    try {
      let weightKg: number | null = null;
      const w = newWeightKg.trim();

      if (w) {
        const parsed = Number(w.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed <= 0) {
          setSaveErr("Peso non valido. Inserisci un numero > 0 (es. 12.5).");
          setSaving(false);
          return;
        }
        weightKg = Math.round(parsed * 10) / 10;
      }

      const titleForPayload = typeLabel(newType);

      if (!newType || !newDate) {
        setSaveErr("Compila tipo e data.");
        setSaving(false);
        return;
      }

      if (newType === "imaging") {
        if (newFiles.length === 0) {
          setSaveErr("Per un evento imaging devi caricare almeno un file.");
          setSaving(false);
          return;
        }

        const fd = new FormData();
        fd.append("animalId", String(id));
        fd.append("eventDate", newDate);
        fd.append("modality", newImagingModality);
        fd.append("bodyPart", newImagingBodyPart.trim());
        fd.append("description", newNotes.trim());
        fd.append("visibility", "owner");
        fd.append("file", newFiles[0]);

        const imagingRes = await fetch("/api/clinic/imaging/upload", {
          method: "POST",
          headers: {
            ...(await authHeaders()),
          },
          body: fd,
        });

        const imagingJson = await imagingRes.json().catch(() => ({}));

        if (!imagingRes.ok) {
          setSaveErr(imagingJson?.error || "Errore salvataggio imaging.");
          setSaving(false);
          return;
        }

        setSaveOk("Evento imaging salvato ✅");
        setNewNotes("");
        setNewFiles([]);
        setNewWeightKg("");
        setNewVetSignature("");
        setTherapyStartDate("");
        setTherapyEndDate("");
        setSelectedVaccines([]);
        setVaccineBatch("");
        setVaccineNextDue("");
        setReminderEnabled(false);
        setRemindAt("");
        setReminderPresetDays(null);
        setNewImagingModality("RX");
        setNewImagingBodyPart("");

        await loadClinicEvents();
        await loadFilesCount();

        setSaving(false);
        return;
      }

      const payload = {
        animalId: id,
        eventDate: newDate,
        type: newType,
        title:
          newType === "vaccine" && selectedVaccines.length > 0
            ? `Vaccinazione: ${selectedVaccines.join(", ")}`
            : titleForPayload,
        description: newNotes.trim() || null,
        visibility: "owner" as const,
        weightKg,
        vetSignature: newVetSignature.trim() || null,
        therapyStartDate: newType === "therapy" ? therapyStartDate || null : null,
        therapyEndDate: newType === "therapy" ? therapyEndDate || null : null,
        meta:
          newType === "vaccine"
            ? {
                vaccine_types: selectedVaccines,
                batch_number: vaccineBatch || null,
                next_due_date: vaccineNextDue || null,
              }
            : null,
        reminderEnabled,
        remindAt: reminderEnabled ? remindAt || null : null,
        remindEmail,
        hasAttachments: newFiles.length > 0,
      };

      const res = await fetch("/api/clinic-events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSaveErr(json?.error || "Errore salvataggio evento.");
        return;
      }

      const createdEvent = json?.event as ClinicEventRow | undefined;
      if (createdEvent) {
        setEvents((prev) => [createdEvent, ...prev]);
        if (newFiles.length > 0) {
          setFilesCountByEventId((prev) => ({
            ...prev,
            [createdEvent.id]: newFiles.length,
          }));
        }
      }

      if (!createdEvent?.id) {
        setSaveErr("Evento creato ma risposta incompleta.");
        return;
      }

      if (newFiles.length > 0) {
        const fd = new FormData();
        fd.append("eventId", String(createdEvent.id));
        fd.append("animalId", String(id));
        for (const f of newFiles) {
          fd.append("files", f);
        }

        const upRes = await fetch("/api/clinic-events/files/upload", {
          method: "POST",
          headers: {
            ...(await authHeaders()),
          },
          body: fd,
        });

        if (!upRes.ok) {
          const upJson = await upRes.json().catch(() => ({}));
          setSaveErr(upJson?.error || "Evento salvato, ma caricamento allegati non riuscito.");
        } else {
          const upJson = await upRes.json().catch(() => ({}));
          const uploadedFiles = Array.isArray(upJson?.files) ? upJson.files : [];
          if (createdEvent?.id) {
            setFilesCountByEventId((prev) => ({
              ...prev,
              [createdEvent.id]: uploadedFiles.length || newFiles.length,
            }));
          }
        }
      }

      setSaveOk("Evento salvato ✅");
      setNewNotes("");
      setNewFiles([]);
      setNewWeightKg("");
      setNewVetSignature("");
      setTherapyStartDate("");
      setTherapyEndDate("");
      setSelectedVaccines([]);
      setVaccineBatch("");
      setVaccineNextDue("");
      setReminderEnabled(false);
      setRemindAt("");
      setReminderPresetDays(null);

      await loadClinicEvents();
      await loadFilesCount();
    } catch {
      setSaveErr("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  async function verifyEvent(eventId: string) {
    if (!id) return;
    setVerifyingId(eventId);
    setVerifyErr(null);

    try {
      const res = await fetch("/api/clinic-events/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ eventIds: [eventId], ids: [eventId] }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVerifyErr(json?.error || "Errore durante la validazione.");
        return;
      }

      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                verified_at: new Date().toISOString(),
                verified_by_label: e.verified_by_label || "Veterinario",
              }
            : e
        )
      );

      await loadClinicEvents();
      await loadFilesCount();
    } catch {
      setVerifyErr("Errore di rete durante la validazione.");
    } finally {
      setVerifyingId(null);
    }
  }

  function isEventVerified(ev: ClinicEventRow) {
    return ev.source === "professional" || ev.source === "veterinarian" || !!ev.verified_at;
  }

  const pendingIds = useMemo(() => {
    return events.filter((e) => !isEventVerified(e)).map((e) => e.id);
  }, [events]);

  const vetFilterOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        events
          .map((ev) => getEventAuthorLabel(ev))
          .filter((v) => typeof v === "string" && v.trim().length > 0)
      )
    ).sort((a, b) => a.localeCompare(b, "it"));
    return names;
  }, [events]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function selectAllPending() {
    setSelectedIds(new Set(pendingIds));
  }

  async function verifyMany(idsToVerify: string[]) {
    if (!id || idsToVerify.length === 0) return;
    setBulkVerifying(true);
    setVerifyErr(null);

    try {
      const res = await fetch("/api/clinic-events/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ eventIds: idsToVerify, ids: idsToVerify }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVerifyErr(json?.error || "Errore durante la validazione.");
        return;
      }

      const nowIso = new Date().toISOString();
      setEvents((prev) =>
        prev.map((e) =>
          idsToVerify.includes(e.id)
            ? {
                ...e,
                verified_at: nowIso,
                verified_by_label: e.verified_by_label || "Veterinario",
              }
            : e
        )
      );

      clearSelection();
      await loadClinicEvents();
      await loadFilesCount();
    } catch {
      setVerifyErr("Errore di rete durante la validazione.");
    } finally {
      setBulkVerifying(false);
    }
  }

  function canEditOrDelete(ev: ClinicEventRow) {
    if (ev.source === "owner") return true;
    const createdBy = (ev as any).created_by as string | null | undefined;
    if (!createdBy || !currentUserId) return false;
    return createdBy === currentUserId;
  }

  async function updateDetailEvent() {
    if (!detailEvent) return;
    setUpdating(true);
    setModalErr(null);

    try {
      const res = await fetch("/api/clinic-events/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          id: detailEvent.id,
          title: editTitle.trim(),
          type: editType,
          eventDate: editDate,
          description: editDesc.trim() || null,
          therapyStartDate: editType === "therapy" ? editTherapyStartDate || null : null,
          therapyEndDate: editType === "therapy" ? editTherapyEndDate || null : null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setModalErr(json?.error || "Errore durante la modifica.");
        return;
      }

      const updated = json?.event as ClinicEventRow | undefined;
      if (updated) {
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setDetailEvent(updated);
      }

      setIsEditing(false);
      setDeleteConfirm(false);
      await loadClinicEvents();
      await loadFilesCount();
    } catch {
      setModalErr("Errore di rete durante la modifica.");
    } finally {
      setUpdating(false);
    }
  }

  async function deleteDetailEvent() {
    if (!detailEvent) return;
    setDeleting(true);
    setModalErr(null);

    try {
      const res = await fetch("/api/clinic-events/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ id: detailEvent.id }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setModalErr(json?.error || "Errore durante l’eliminazione.");
        return;
      }

      setEvents((prev) => prev.filter((e) => e.id !== detailEvent.id));
      setDetailEvent(null);
      setIsEditing(false);
      setDeleteConfirm(false);
      await loadClinicEvents();
      await loadFilesCount();
    } catch {
      setModalErr("Errore di rete durante l’eliminazione.");
    } finally {
      setDeleting(false);
    }
  }

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();

    let base = (() => {
      if (filter === "all") return events;
      if (filter === "weight") return (events || []).filter((e) => extractWeightKg(e) !== null);
      if (filter === "document") {
        return (events || []).filter((e) => {
          const hasFiles = (filesCountByEventId?.[e.id] ?? 0) > 0;
          return hasFiles;
        });
      }
      return (events || []).filter((e) => e.type === filter);
    })();

    if (vetFilter !== "all") {
      base = base.filter((e) => getEventAuthorLabel(e) === vetFilter);
    }

    if (!q) return base;

    return base.filter((e) => {
      const hay = [
        e.title,
        e.description,
        e.type,
        e?.meta?.created_by_member_label,
        e?.meta?.created_by_org_name,
        e?.meta?.org_name,
        getEventAuthorLabel(e),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [events, filter, filesCountByEventId, search, vetFilter]);

  const groupedEvents = useMemo(() => {
    const groups: Array<{ key: string; label: string; events: ClinicEventRow[] }> = [];
    const map = new Map<string, ClinicEventRow[]>();

    for (const ev of filteredEvents) {
      const key = (ev.event_date || "").slice(0, 10) || "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }

    for (const [key, rows] of map.entries()) {
      groups.push({
        key,
        label: formatDayGroupLabel(key),
        events: rows,
      });
    }

    groups.sort((a, b) => (a.key < b.key ? 1 : -1));
    return groups;
  }, [filteredEvents]);

  const flattenedShownEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleCount);
  }, [filteredEvents, visibleCount]);

  const shownEventIds = useMemo(
    () => new Set(flattenedShownEvents.map((e) => e.id)),
    [flattenedShownEvents]
  );

  const shownGroupedEvents = useMemo(() => {
    return groupedEvents
      .map((g) => ({
        ...g,
        events: g.events.filter((e) => shownEventIds.has(e.id)),
      }))
      .filter((g) => g.events.length > 0);
  }, [groupedEvents, shownEventIds]);

  const hasMore = flattenedShownEvents.length < filteredEvents.length;
  const canSave = !saving && !!newDate && !!newType;

  const detailInitialSnapshot = useMemo(() => {
    if (!detailEvent) return "";
    return JSON.stringify({
      title: (detailEvent.title || "").trim(),
      type: detailEvent.type,
      eventDate: (detailEvent.event_date || "").slice(0, 10),
      description: (detailEvent.description || "").trim(),
      therapyStartDate: extractTherapyStartDate(detailEvent) || "",
      therapyEndDate: extractTherapyEndDate(detailEvent) || "",
    });
  }, [detailEvent]);

  const detailDraftSnapshot = useMemo(() => {
    return JSON.stringify({
      title: editTitle.trim(),
      type: editType,
      eventDate: editDate,
      description: editDesc.trim(),
      therapyStartDate: editType === "therapy" ? editTherapyStartDate || "" : "",
      therapyEndDate: editType === "therapy" ? editTherapyEndDate || "" : "",
    });
  }, [editDate, editDesc, editTherapyEndDate, editTherapyStartDate, editTitle, editType]);

  const isDetailDirty = isEditing && !!detailEvent && detailInitialSnapshot !== detailDraftSnapshot;

  function resetEditStateFromEvent(ev: ClinicEventRow | null) {
    setEditTitle(ev?.title || "");
    setEditType(ev?.type || "visit");
    setEditDate((ev?.event_date || "").slice(0, 10));
    setEditDesc(ev?.description || "");
    setEditTherapyStartDate(extractTherapyStartDate(ev) || "");
    setEditTherapyEndDate(extractTherapyEndDate(ev) || "");
  }

  function closeDetailModal() {
    setDetailEvent(null);
    setIsEditing(false);
    setDeleteConfirm(false);
    setModalErr(null);
  }

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link
          href={`/professionisti/animali/${id}`}
          className="font-semibold text-zinc-700 hover:text-zinc-900"
        >
          ← Torna alla scheda
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Cartella clinica professionale
              </div>
              <h1 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl">
                {animal?.name || "Animale"} <span className="text-zinc-400">•</span>{" "}
                <span className="text-zinc-700">
                  {animal?.species || "Specie non disponibile"}
                  {animal?.breed ? ` • ${animal.breed}` : ""}
                </span>
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                Timeline cronologica, validazione eventi, allegati, promemoria e collaborazione
                tra professionisti.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                onClick={() => {
                  if (!animal?.id) return;
                  router.push(`/professionisti/animali/${animal.id}/consulto`);
                }}
              >
                Condividi cartella
              </button>

              {isVet ? (
                <Link
                  href={`/professionisti/animali/${id}/verifica`}
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-900"
                >
                  Validazione (vet)
                </Link>
              ) : (
                <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-600">
                  Validazione riservata ai vet
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 md:grid-cols-3 md:px-6">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Animale
            </div>
            <div className="mt-2 text-sm font-semibold text-zinc-900">{animal?.name || "—"}</div>
            <div className="mt-1 text-sm text-zinc-600">
              {animal?.species || "—"}
              {animal?.breed ? ` • ${animal.breed}` : ""}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Microchip / Codice
            </div>
            <div className="mt-2 break-all text-sm font-semibold text-zinc-900">
              {normalizeChip(animal?.chip_number) || "Non disponibile"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Identificazione rapida per accesso clinico e verifica.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Proprietario
            </div>

            <div className="mt-2 text-sm font-semibold text-zinc-900">
              {animal?.owner_name || "Non disponibile"}
            </div>

            <div className="mt-1 text-sm text-zinc-600">
              Email: {animal?.owner_email || "—"}
            </div>

            <div className="mt-1 text-sm text-zinc-600">
              Telefono: {animal?.owner_phone || "—"}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
        {isVet && pendingIds.length > 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-zinc-700">
                Eventi in attesa: <span className="font-semibold">{pendingIds.length}</span>
                {selectedIds.size > 0 ? (
                  <>
                    {" "}
                    • Selezionati: <span className="font-semibold">{selectedIds.size}</span>
                  </>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                  disabled={bulkVerifying}
                  onClick={() => selectAllPending()}
                >
                  Seleziona tutti
                </button>

                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                  disabled={bulkVerifying || selectedIds.size === 0}
                  onClick={() => void verifyMany(Array.from(selectedIds))}
                >
                  {bulkVerifying ? "Validazione…" : "Valida selezionati"}
                </button>

                <button
                  type="button"
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-900 disabled:opacity-50"
                  disabled={bulkVerifying}
                  onClick={() => void verifyMany(pendingIds)}
                  title="Valida tutti gli eventi in attesa"
                >
                  {bulkVerifying ? "Validazione…" : "Valida tutto"}
                </button>

                {selectedIds.size > 0 ? (
                  <button
                    type="button"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                    disabled={bulkVerifying}
                    onClick={() => clearSelection()}
                  >
                    Azzera
                  </button>
                ) : null}
              </div>
            </div>

            <p className="mt-2 text-xs leading-5 text-zinc-600">
              Puoi selezionare i singoli eventi “⏳ da validare” direttamente dalla timeline.
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Inserimento rapido
              </div>
              <h2 className="mt-3 text-base font-semibold text-zinc-900">Nuovo evento clinico</h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600">
                Registra subito visite, vaccini, esami, terapie e documenti. Dopo il salvataggio
                l’evento resta in questa pagina e compare subito nella timeline.
              </p>
            </div>
          </div>

          {saveErr ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-800">
              {saveErr}
            </div>
          ) : null}

          {saveOk ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm leading-6 text-emerald-800">
              {saveOk}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-12">
            <label className="block md:col-span-3">
              <span className={FIELD_LABEL_CLASS}>Tipo evento</span>
              <select
                className={FIELD_CLASS}
                value={newType}
                onChange={(e) => setNewType(e.target.value as ClinicEventType)}
              >
                <option value="visit">🩺 Visita</option>
                <option value="vaccine">💉 Vaccinazione</option>
                <option value="exam">🔬 Esame</option>
                <option value="imaging">🖼️ Imaging</option>
                <option value="therapy">💊 Terapia</option>
                <option value="chronic_condition">📌 Patologia cronica</option>
                <option value="follow_up">🔁 Prossimo ricontrollo</option>
                <option value="surgery">🏥 Intervento chirurgico</option>
                <option value="note">📝 Nota</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className={FIELD_LABEL_CLASS}>Data</span>
              <input
                type="date"
                className={FIELD_CLASS}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </label>

            <label className="block md:col-span-2">
              <span className={FIELD_LABEL_CLASS}>Peso (kg)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                className={FIELD_CLASS}
                value={newWeightKg}
                onChange={(e) => setNewWeightKg(e.target.value)}
                placeholder="Es. 12.5"
              />
            </label>

            <label className="block md:col-span-5">
              <span className={FIELD_LABEL_CLASS}>
                {newType === "imaging" ? "File imaging" : "Allegati"}
              </span>
              <input
                type="file"
                multiple={newType !== "imaging"}
                accept={
                  newType === "imaging"
                    ? ".dcm,application/dicom,.dicom,image/jpeg,image/png,application/pdf"
                    : ".pdf,image/jpeg,image/png,image/webp"
                }
                className={FILE_INPUT_CLASS}
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);

                  if (newType === "imaging" && list.length > 1) {
                    setSaveErr("Per imaging puoi caricare un solo file alla volta.");
                    setNewFiles(list.slice(0, 1));
                    return;
                  }

                  setSaveErr(null);
                  setNewFiles(list);
                }}
              />

              {newType === "imaging" ? (
                <div className="mt-1.5 text-[11px] leading-5 text-zinc-600">
                  Formati ammessi imaging:{" "}
                  <span className="font-semibold">.dcm, .dicom, PDF, JPG, PNG</span>
                </div>
              ) : (
                <div className="mt-1.5 text-[11px] leading-5 text-zinc-600">
                  Formati ammessi: <span className="font-semibold">PDF, JPG, PNG, WEBP</span>
                </div>
              )}

              {newFiles.length > 0 ? (
                <div className="mt-1.5 text-[11px] leading-5 text-zinc-600">
                  📎 <span className="font-semibold">{newFiles.length}</span>
                  {newType === "imaging" ? ` • ${newFiles[0]?.name || ""}` : ""}
                </div>
              ) : null}
            </label>

            {newType === "vaccine" ? (
              <div className="grid gap-4 md:col-span-12 md:grid-cols-12">
                <div className="block md:col-span-6">
                  <span className={FIELD_LABEL_CLASS}>Vaccini eseguiti</span>
                  <div className="mt-1 grid gap-2 rounded-2xl border border-zinc-300 bg-zinc-50 p-3">
                    {(isCatSpecies(animalSpecies) ? CAT_VACCINES : DOG_VACCINES).map((v) => {
                      const checked = selectedVaccines.includes(v.value);
                      return (
                        <label
                          key={v.value}
                          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={() => toggleSelectedVaccine(v.value)}
                          />
                          <span>{v.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                    Puoi selezionare più vaccini nello stesso evento.
                  </p>
                </div>

                <label className="block md:col-span-3">
                  <span className={FIELD_LABEL_CLASS}>Lotto vaccino</span>
                  <input
                    type="text"
                    className={FIELD_CLASS}
                    value={vaccineBatch}
                    onChange={(e) => setVaccineBatch(e.target.value)}
                    placeholder="Lotto"
                  />
                </label>

                <label className="block md:col-span-3">
                  <span className={FIELD_LABEL_CLASS}>Prossimo richiamo</span>
                  <input
                    type="date"
                    className={FIELD_CLASS}
                    value={vaccineNextDue}
                    onChange={(e) => setVaccineNextDue(e.target.value)}
                  />
                </label>
              </div>
            ) : null}

            {newType === "therapy" ? (
              <div className="grid gap-4 md:col-span-12 md:grid-cols-12">
                <label className="block md:col-span-6">
                  <span className={FIELD_LABEL_CLASS}>Inizio terapia</span>
                  <input
                    type="date"
                    className={FIELD_CLASS}
                    value={therapyStartDate}
                    onChange={(e) => setTherapyStartDate(e.target.value)}
                  />
                </label>

                <label className="block md:col-span-6">
                  <span className={FIELD_LABEL_CLASS}>Fine terapia</span>
                  <input
                    type="date"
                    className={FIELD_CLASS}
                    value={therapyEndDate}
                    onChange={(e) => setTherapyEndDate(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                    Se lasci vuoto, la terapia è considerata in corso.
                  </p>
                </label>
              </div>
            ) : null}

            {newType === "imaging" ? (
              <div className="grid gap-4 md:col-span-12 md:grid-cols-12">
                <label className="block md:col-span-4">
                  <span className={FIELD_LABEL_CLASS}>Modalità</span>
                  <select
                    className={FIELD_CLASS}
                    value={newImagingModality}
                    onChange={(e) => setNewImagingModality(e.target.value)}
                  >
                    <option value="RX">RX</option>
                    <option value="TAC">TAC</option>
                    <option value="RM">RM</option>
                    <option value="ECO">ECO</option>
                  </select>
                </label>

                <label className="block md:col-span-8">
                  <span className={FIELD_LABEL_CLASS}>Distretto</span>
                  <input
                    type="text"
                    className={FIELD_CLASS}
                    value={newImagingBodyPart}
                    onChange={(e) => setNewImagingBodyPart(e.target.value)}
                    placeholder="Es. Torace, Addome, Arto anteriore destro"
                  />
                </label>

                <div className="md:col-span-12 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                  Per gli eventi imaging il file diagnostico va caricato solo qui e verrà salvato
                  su storage dedicato Cloudflare.
                </div>
              </div>
            ) : null}

            <label className="block md:col-span-12">
              <span className={FIELD_LABEL_CLASS}>Note cliniche</span>
              <textarea
                className={TEXTAREA_CLASS}
                rows={4}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Dettagli clinici, note, dosaggi, esito, osservazioni..."
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-12">
            <label className="block md:col-span-9">
              <span className={FIELD_LABEL_CLASS}>Firma veterinario (opzionale)</span>
              <input
                type="text"
                className={FIELD_CLASS}
                placeholder="Temporaneo: sarà sostituito da tendina ricercabile veterinari"
                value={newVetSignature || ""}
                onChange={(e) => setNewVetSignature(e.target.value)}
              />
              {vetOptions.length === 0 && !selectedVetId ? (
                <div className="mt-1.5 text-[11px] leading-5 text-zinc-500">
                  Campo temporaneo: presto verrà sostituito da una tendina ricercabile.
                </div>
              ) : null}
            </label>

            <div className="flex items-end md:col-span-3">
              <button
                type="button"
                className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-900 disabled:opacity-60"
                disabled={!canSave}
                onClick={() => void saveClinicEvent()}
              >
                {saving
                  ? "Salvataggio…"
                  : newType === "imaging"
                    ? "Salva imaging"
                    : "Salva evento e aggiorna timeline"}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={reminderEnabled}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setReminderEnabled(v);
                    if (!v) {
                      setRemindAt("");
                      setReminderPresetDays(null);
                    }
                    if (v && !remindAt) {
                      setReminderPresetDays(30);
                      setRemindAt(addDaysISO(newDate, 30));
                    }
                  }}
                />
                Imposta promemoria per l’owner
              </label>
              <span className="text-xs text-zinc-600">Email ✅ • Push ⏳</span>
            </div>

            {reminderEnabled ? (
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className={FIELD_LABEL_CLASS}>Data promemoria</span>
                  <input
                    type="date"
                    className={FIELD_CLASS}
                    value={remindAt}
                    onChange={(e) => {
                      setRemindAt(e.target.value);
                      setReminderPresetDays(null);
                    }}
                  />
                </label>

                <div className="block">
                  <span className={FIELD_LABEL_CLASS}>Canali</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={remindEmail}
                        onChange={(e) => setRemindEmail(e.target.checked)}
                      />
                      Email
                    </label>
                    <span
                      className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500"
                      title="Disponibile quando UNIMALIA diventa web app (PWA)"
                    >
                      Push (in arrivo)
                    </span>
                  </div>
                </div>

                {showRecallQuickActions ? (
                  <div className="md:col-span-2">
                    <div className="text-xs font-semibold text-zinc-700">Suggerisci richiamo</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[15, 30, 180, 365].map((days) => (
                        <button
                          key={days}
                          type="button"
                          className={
                            reminderPresetDays === days
                              ? "rounded-2xl border border-black bg-black px-3 py-2 text-sm font-semibold text-white"
                              : "rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                          }
                          onClick={() => onSuggestRecall(days)}
                        >
                          {days === 180
                            ? "+6 mesi"
                            : days === 365
                              ? "+12 mesi"
                              : `+${days} giorni`}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {newType === "vaccine" && remindAt ? (
                  <p className="text-xs leading-5 text-zinc-600 md:col-span-2">
                    Nota vaccino: oltre al promemoria alla data impostata, l’owner verrà avvisato
                    anche <span className="font-semibold">15 giorni prima</span>.
                  </p>
                ) : null}

                <p className="text-xs leading-5 text-zinc-600 md:col-span-2">
                  Il promemoria verrà inviato <span className="font-semibold">solo al proprietario</span>.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {eventsErr ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm leading-6 text-amber-900">
            {eventsErr}
          </div>
        ) : null}

        {verifyErr ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-800">
            {verifyErr}
          </div>
        ) : null}

        <div>
          <h2 className="text-base font-semibold text-zinc-900">Timeline clinica</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Eventi cronologici, professionista visibile subito, stato validazione chiaro e
            dettaglio completo al click.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-700">
              Eventi totali: <span className="font-semibold">{events.length}</span> • Filtrati:{" "}
              <span className="font-semibold">{filteredEvents.length}</span> • Mostrati:{" "}
              <span className="font-semibold">{flattenedShownEvents.length}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    className={
                      active
                        ? "rounded-full border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                    }
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              className={FIELD_CLASS}
              placeholder="Cerca in note, descrizione, tipo evento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className={FIELD_CLASS}
              value={vetFilter}
              onChange={(e) => setVetFilter(e.target.value)}
            >
              <option value="all">Tutti i professionisti</option>
              {vetFilterOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600">
              Filtra rapidamente per tipo, testo e professionista.
            </div>
          </div>
        </div>

        {eventsLoading ? (
          <div className="text-sm text-zinc-600">Caricamento eventi…</div>
        ) : filteredEvents.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm leading-6 text-zinc-600">
            Nessun evento per questo filtro.
          </div>
        ) : (
          <div className="space-y-5">
            {shownGroupedEvents.map((group) => (
              <div key={group.key} className="space-y-2">
                <div className="sticky top-0 z-10 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-800">
                  {group.label}
                </div>

                <div className="flex flex-col gap-2">
                  {group.events.map((ev) => {
                    const isVerified = isEventVerified(ev);
                    const isSelected = selectedIds.has(ev.id);
                    const evKg = extractWeightKg(ev);

                    return (
                      <div
                        key={ev.id}
                        className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                        onClick={() => {
                          setDetailEvent(ev);
                          setIsEditing(false);
                          setDeleteConfirm(false);
                          setModalErr(null);
                          resetEditStateFromEvent(ev);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              {!isVerified && isVet ? (
                                <input
                                  type="checkbox"
                                  className="mt-1 h-4 w-4"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(ev.id)}
                                  title="Seleziona per validazione"
                                />
                              ) : null}

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700">
                                    {eventTypeDisplay(ev.type)}
                                  </span>
                                  <span className="font-medium text-zinc-700">
                                    {formatEventDateIT(ev.event_date)}
                                  </span>
                                  {ev.created_at ? (
                                    <span className="text-zinc-400">
                                      {" "}
                                      • Inserito il {formatInsertedAtIT(ev.created_at)}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  {evKg !== null ? (
                                    <span
                                      className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700"
                                      title="Peso registrato"
                                    >
                                      ⚖ {formatWeightLabel(evKg)}
                                    </span>
                                  ) : null}

                                  {(filesCountByEventId[ev.id] ?? 0) > 0 ? (
                                    <span
                                      className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700"
                                      title={`Allegati: ${filesCountByEventId[ev.id]}`}
                                    >
                                      📎 {filesCountByEventId[ev.id]}
                                    </span>
                                  ) : null}

                                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
                                    {visibilityLabel(ev.visibility)}
                                  </span>
                                </div>

                                <div className="mt-3 text-sm font-semibold leading-6 text-zinc-900">
                                  {ev.title || typeLabel(ev.type)}
                                </div>

                                <div className="mt-1 text-xs font-medium text-zinc-500">
                                  {getEventAuthorLabel(ev)}
                                </div>

                                {ev.description ? (
                                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-700">
                                    {ev.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            {isVerified ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                ✓ Validato
                              </span>
                            ) : (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                                ⏳ Da validare
                              </span>
                            )}

                            {!isVerified && isVet ? (
                              <button
                                type="button"
                                className="rounded-xl bg-black px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-zinc-900 disabled:opacity-50"
                                disabled={verifyingId === ev.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void verifyEvent(ev.id);
                                }}
                                title="Valida questo evento"
                              >
                                {verifyingId === ev.id ? "Validazione…" : "Valida"}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {hasMore ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                >
                  Carica altri
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {detailEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="p-5 md:p-6">
              {(() => {
                const allowed = detailEvent ? canEditOrDelete(detailEvent) : false;
                const kg = extractWeightKg(detailEvent);

                return (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold leading-6 text-zinc-900">
                          {detailEvent.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                            {eventTypeDisplay(detailEvent.type)}
                          </span>
                          <span>{formatEventDateIT(detailEvent.event_date)}</span>
                        </div>

                        <div className="mt-2 text-sm font-medium text-zinc-600">
                          {getEventAuthorLabel(detailEvent)}
                        </div>

                        <div className="mt-2 text-xs text-zinc-400">
                          Inserito il {formatInsertedAtIT(detailEvent.created_at)}
                        </div>

                        {kg !== null ? (
                          <div className="mt-3 text-sm leading-6 text-zinc-700">
                            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                              ⚖ {formatWeightLabel(kg)}
                            </span>
                          </div>
                        ) : null}

                        {detailEvent.type === "therapy" ? (
                          <div className="mt-3 space-y-1.5 text-sm leading-6 text-zinc-700">
                            <div>
                              <span className="font-semibold">Inizio terapia:</span>{" "}
                              {formatEventDateIT(extractTherapyStartDate(detailEvent))}
                            </div>
                            <div>
                              <span className="font-semibold">Fine terapia:</span>{" "}
                              {extractTherapyEndDate(detailEvent)
                                ? formatEventDateIT(extractTherapyEndDate(detailEvent))
                                : "In corso"}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <>
                            <button
                              type="button"
                              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                              disabled={!allowed}
                              onClick={() => {
                                setIsEditing(true);
                                setDeleteConfirm(false);
                              }}
                              title={!allowed ? "Non autorizzato a modificare questo evento" : ""}
                            >
                              Modifica
                            </button>

                            <button
                              type="button"
                              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
                              disabled={!allowed}
                              onClick={() => setDeleteConfirm(true)}
                              title={!allowed ? "Non autorizzato a eliminare questo evento" : ""}
                            >
                              Elimina
                            </button>

                            <button
                              type="button"
                              className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                              onClick={closeDetailModal}
                            >
                              Chiudi
                            </button>
                          </>
                        ) : (
                          <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700">
                            Modalità modifica
                          </span>
                        )}
                      </div>
                    </div>

                    {modalErr ? (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-800">
                        {modalErr}
                      </div>
                    ) : null}

                    <div className="mt-6 max-h-[55vh] space-y-4 overflow-y-auto pr-1 text-sm">
                      {!isEditing ? (
                        <>
                          {detailEvent.description ? (
                            <div>
                              <div className="text-xs font-semibold text-zinc-700">Descrizione</div>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                                {detailEvent.description}
                              </p>
                            </div>
                          ) : null}

                          {detailEvent.type === "imaging" ? (
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                              <div className="text-xs font-semibold text-zinc-700">
                                Dati imaging
                              </div>

                              <div className="mt-3 space-y-2 text-sm text-zinc-700">
                                <div>
                                  <span className="font-semibold">Modalità:</span>{" "}
                                  {detailEvent.meta?.imaging?.modality || "—"}
                                </div>
                                <div>
                                  <span className="font-semibold">Distretto:</span>{" "}
                                  {detailEvent.meta?.imaging?.body_part || "—"}
                                </div>
                              </div>

                              {Array.isArray(detailEvent.meta?.imaging?.files) &&
                              detailEvent.meta.imaging.files.length > 0 ? (
                                <div className="mt-4 space-y-3">
                                  {detailEvent.meta.imaging.files.map((file: any) => {
                                    const isImage =
                                      file.mime?.startsWith("image/") ||
                                      file.name?.toLowerCase().endsWith(".jpg") ||
                                      file.name?.toLowerCase().endsWith(".png");

                                    return (
                                      <div
                                        key={file.id || file.path}
                                        className="rounded-xl border border-zinc-200 bg-white p-3"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="text-sm font-semibold text-zinc-900 truncate">
                                              {file.name || "File imaging"}
                                            </div>

                                            <div className="mt-1 text-xs text-zinc-500">
                                              {file.mime || "mime sconosciuto"}
                                              {typeof file.size === "number"
                                                ? ` • ${Math.round(file.size / 1024)} KB`
                                                : ""}
                                            </div>
                                          </div>

                                          <div className="shrink-0">
                                            <button
                                              type="button"
                                              className="shrink-0 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white"
                                              onClick={() =>
                                                void openImagingFile(detailEvent.id, file.path)
                                              }
                                            >
                                              Apri
                                            </button>
                                            <a
                                              href="#"
                                              onClick={async (e) => {
                                                e.preventDefault();

                                                const res = await fetch("/api/clinic/imaging/download", {
                                                  method: "POST",
                                                  headers: {
                                                    "Content-Type": "application/json",
                                                    ...(await authHeaders()),
                                                  },
                                                  body: JSON.stringify({
                                                    eventId: detailEvent.id,
                                                    filePath: file.path,
                                                  }),
                                                });

                                                const json = await res.json().catch(() => ({}));

                                                if (!res.ok || !json?.url) {
                                                  alert("Errore download file");
                                                  return;
                                                }

                                                const link = document.createElement("a");
                                                link.href = json.url;
                                                link.download = file.name || "imaging";
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                              }}
                                              className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
                                            >
                                              Scarica file
                                            </a>
                                          </div>
                                        </div>

                                        {isImage ? (
                                          <div className="mt-3">
                                            <img
                                              src="#"
                                              alt="preview"
                                              className="max-h-40 w-full rounded-lg object-cover bg-zinc-100"
                                              onClick={() =>
                                                void openImagingFile(detailEvent.id, file.path)
                                              }
                                            />
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="mt-3 text-xs text-zinc-600">
                                  Nessun file imaging associato.
                                </div>
                              )}
                            </div>
                          ) : null}

                          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <div className="text-xs font-semibold text-zinc-700">Allegati</div>

                            {detailFilesLoading ? (
                              <div className="mt-2 text-xs text-zinc-600">Caricamento...</div>
                            ) : detailFiles.length === 0 ? (
                              <div className="mt-2 text-xs text-zinc-600">Nessun allegato.</div>
                            ) : (
                              <ul className="mt-3 space-y-2">
                                {detailFiles.map((f) => (
                                  <li
                                    key={f.id}
                                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800"
                                  >
                                    {f.filename}
                                  </li>
                                ))}
                              </ul>
                            )}

                            <label className="mt-4 block">
                              <span className={FIELD_LABEL_CLASS}>Aggiungi allegati</span>
                              <input
                                type="file"
                                multiple
                                className={FILE_INPUT_CLASS}
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (!files.length) return;

                                  const fd = new FormData();
                                  fd.append("eventId", String(detailEvent.id));
                                  fd.append("animalId", String(detailEvent.animal_id));
                                  for (const f of files) fd.append("files", f);

                                  const uploadRes = await fetch("/api/clinic-events/files/upload", {
                                    method: "POST",
                                    headers: {
                                      ...(await authHeaders()),
                                    },
                                    body: fd,
                                  });

                                  const uploadJson = await uploadRes.json().catch(() => ({}));

                                  if (uploadRes.ok) {
                                    const uploadedFiles = Array.isArray(uploadJson?.files)
                                      ? uploadJson.files
                                      : [];
                                    setFilesCountByEventId((prev) => ({
                                      ...prev,
                                      [detailEvent.id]: Math.max(
                                        prev[detailEvent.id] ?? 0,
                                        (detailFiles?.length ?? 0) + uploadedFiles.length
                                      ),
                                    }));
                                  }

                                  await loadClinicEvents();
                                  await loadFilesCount();

                                  try {
                                    const res = await fetch(
                                      `/api/clinic-events/files/list?eventId=${encodeURIComponent(detailEvent.id)}`,
                                      {
                                        cache: "no-store",
                                        headers: {
                                          ...(await authHeaders()),
                                        },
                                      }
                                    );
                                    const j = await res.json().catch(() => ({}));
                                    const refreshedFiles = (j?.files as any[]) ?? [];
                                    setDetailFiles(refreshedFiles);
                                    setFilesCountByEventId((prev) => ({
                                      ...prev,
                                      [detailEvent.id]: refreshedFiles.length,
                                    }));
                                  } catch {
                                    // no-op
                                  } finally {
                                    e.currentTarget.value = "";
                                  }
                                }}
                              />
                            </label>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                            <div className="text-xs font-semibold text-zinc-700">
                              Stato validazione
                            </div>
                            {detailEvent.source === "professional" ||
                            detailEvent.source === "veterinarian" ||
                            detailEvent.verified_at ? (
                              <div className="mt-2 font-semibold text-emerald-700">
                                ✓ Validato{" "}
                                {detailEvent.verified_by_label
                                  ? `da ${detailEvent.verified_by_label}`
                                  : ""}
                              </div>
                            ) : (
                              <div className="mt-2 font-semibold text-amber-700">
                                ⏳ In attesa di validazione
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <div className="text-xs font-semibold text-zinc-700">
                              Meta informazioni
                            </div>
                            <div className="mt-2 space-y-1.5 text-xs leading-5 text-zinc-600">
                              <div>
                                ID evento: <span className="font-mono">{detailEvent.id}</span>
                              </div>
                              <div>Visibilità: {visibilityLabel(detailEvent.visibility)}</div>
                              <div>Fonte: {detailEvent.source}</div>
                              <div>Registrato da: {getEventAuthorLabel(detailEvent)}</div>
                              {detailEvent.verified_at ? (
                                <div>Validato il: {formatDateIT(detailEvent.verified_at)}</div>
                              ) : null}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                          <div className="text-xs font-semibold text-zinc-700">Modifica evento</div>

                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <label className="block md:col-span-2">
                              <span className={FIELD_LABEL_CLASS}>Titolo</span>
                              <input
                                type="text"
                                className={FIELD_CLASS}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                              />
                            </label>

                            <label className="block">
                              <span className={FIELD_LABEL_CLASS}>Tipo</span>
                              <select
                                className={FIELD_CLASS}
                                value={editType}
                                onChange={(e) => setEditType(e.target.value as ClinicEventType)}
                              >
                                <option value="visit">🩺 Visita</option>
                                <option value="vaccine">💉 Vaccinazione</option>
                                <option value="exam">🔬 Esame</option>
                                <option value="imaging">🖼️ Imaging</option>
                                <option value="therapy">💊 Terapia</option>
                                <option value="chronic_condition">📌 Patologia cronica</option>
                                <option value="follow_up">🔁 Prossimo ricontrollo</option>
                                <option value="surgery">🏥 Intervento chirurgico</option>
                                <option value="note">📝 Nota</option>
                              </select>
                            </label>

                            <label className="block">
                              <span className={FIELD_LABEL_CLASS}>Data</span>
                              <input
                                type="date"
                                className={FIELD_CLASS}
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                              />
                            </label>

                            {editType === "therapy" ? (
                              <>
                                <label className="block">
                                  <span className={FIELD_LABEL_CLASS}>Inizio terapia</span>
                                  <input
                                    type="date"
                                    className={FIELD_CLASS}
                                    value={editTherapyStartDate}
                                    onChange={(e) => setEditTherapyStartDate(e.target.value)}
                                  />
                                </label>

                                <label className="block">
                                  <span className={FIELD_LABEL_CLASS}>Fine terapia</span>
                                  <input
                                    type="date"
                                    className={FIELD_CLASS}
                                    value={editTherapyEndDate}
                                    onChange={(e) => setEditTherapyEndDate(e.target.value)}
                                  />
                                </label>
                              </>
                            ) : null}

                            <label className="block md:col-span-2">
                              <span className={FIELD_LABEL_CLASS}>Descrizione</span>
                              <textarea
                                className={TEXTAREA_CLASS}
                                rows={4}
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                              />
                            </label>
                          </div>

                          <p className="mt-3 text-xs leading-5 text-zinc-600">
                            Nota: il peso è salvato in “meta” e non è ancora modificabile da questa
                            schermata.
                          </p>
                        </div>
                      )}

                      {deleteConfirm ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                          <div className="text-sm font-semibold text-red-800">
                            Conferma eliminazione
                          </div>
                          <p className="mt-1 text-sm leading-6 text-red-800">
                            Vuoi eliminare questo evento? L’azione sarà tracciata nello storico.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                              onClick={() => setDeleteConfirm(false)}
                              disabled={deleting}
                            >
                              Chiudi
                            </button>
                            <button
                              type="button"
                              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                              disabled={!allowed || deleting}
                              onClick={() => void deleteDetailEvent()}
                            >
                              {deleting ? "Eliminazione…" : "Conferma eliminazione"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                      {isEditing ? (
                        isDetailDirty ? (
                          <>
                            <button
                              type="button"
                              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                              onClick={() => {
                                resetEditStateFromEvent(detailEvent);
                                setIsEditing(false);
                                setDeleteConfirm(false);
                                setModalErr(null);
                              }}
                              disabled={updating}
                            >
                              Annulla modifiche
                            </button>
                            <button
                              type="button"
                              className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-900 disabled:opacity-60"
                              disabled={!allowed || updating || !editTitle.trim() || !editDate}
                              onClick={() => void updateDetailEvent()}
                            >
                              {updating ? "Salvataggio…" : "Salva e chiudi"}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                            onClick={closeDetailModal}
                          >
                            Chiudi
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                          onClick={closeDetailModal}
                        >
                          Chiudi
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}