"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isVetUser } from "@/app/professionisti/_components/ProShell";
import { authHeaders } from "@/lib/client/authHeaders";

// NOTA: il blocco grant-first è nel layout server:
// src/app/professionisti/animali/[id]/clinica/layout.tsx

type ClinicEventType =
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
  | "surgery";

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
  | "surgery";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tutti" },
  { key: "visit", label: "Visite" },
  { key: "vaccine", label: "Vaccini" },
  { key: "exam", label: "Esami" },
  { key: "therapy", label: "Terapie" },
  { key: "surgery", label: "Intervento chirurgico" },
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
    case "allergy":
      return "Allergia";
    case "feeding":
      return "Alimentazione";
    case "note":
      return "Nota";
    case "document":
      return "Documento";
    case "emergency":
      return "Emergenza";
    case "weight":
      return "Peso";
    case "surgery":
      return "Intervento chirurgico";
    default:
      return t;
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

const FIELD_LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-700";
const FIELD_CLASS =
  "mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20";
const TEXTAREA_CLASS =
  "mt-1 min-h-[120px] w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20";
const FILE_INPUT_CLASS =
  "block w-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3.5 py-3 text-sm text-zinc-700 file:mr-3 file:rounded-xl file:border-0 file:bg-black file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-zinc-400 focus-within:border-zinc-500 focus-within:ring-4 focus-within:ring-zinc-200";
const UPLOAD_TRIGGER_CLASS =
  "inline-flex cursor-pointer items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-within:ring-4 focus-within:ring-zinc-200";

export default function ClinicaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [isVet, setIsVet] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [eventsLoading, setEventsLoading] = useState(false);
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [eventsErr, setEventsErr] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

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
  const [vetOptions, setVetOptions] = useState<VetOption[]>([]);
  const [selectedVetId, setSelectedVetId] = useState<string>("");
  const [therapyStartDate, setTherapyStartDate] = useState("");
  const [therapyEndDate, setTherapyEndDate] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  async function loadFilesCount() {
    if (!id) return;

    try {
      const res = await fetch(
        `/api/clinic-events/files/count?animalId=${encodeURIComponent(id)}`,
        {
          cache: "no-store",
          headers: { ...(await authHeaders()) },
        }
      );

      if (!res.ok) return;

      const json = await res.json().catch(() => ({}));
      const counts = (json?.counts as Record<string, number>) ?? {};
      setFilesCountByEventId(counts);
    } catch {
      // no-op
    }
  }

  useEffect(() => {
    if (!id) return;
    void (async () => {
      await loadClinicEvents();
      await loadFilesCount();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, events.length, search]);

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

      const payload = {
        animalId: id,
        eventDate: newDate,
        type: newType,
        title: titleForPayload,
        description: newNotes.trim() || null,
        visibility: "owner" as const,
        weightKg,
        vetSignature: newVetSignature.trim() || null,
        therapyStartDate: newType === "therapy" ? therapyStartDate || null : null,
        therapyEndDate: newType === "therapy" ? therapyEndDate || null : null,
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

      setSaveOk("Evento salvato ✅");

      if (json?.event) {
        setEvents((prev) => [json.event as ClinicEventRow, ...prev]);
      }

      if (json?.event?.id && newFiles.length > 0) {
        const fd = new FormData();
        fd.append("eventId", String(json.event.id));
        fd.append("animalId", String(id));
        for (const f of newFiles) fd.append("files", f);

        const upRes = await fetch("/api/clinic-events/files/upload", {
          method: "POST",
          headers: {
            ...(await authHeaders()),
          },
          body: fd,
        });

        if (!upRes.ok) {
          setSaveErr("Evento salvato, ma caricamento allegati non riuscito.");
        }
      }

      setNewNotes("");
      setNewFiles([]);
      setNewWeightKg("");
      setNewVetSignature("");
      setTherapyStartDate("");
      setTherapyEndDate("");

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
        body: JSON.stringify({
          eventIds: [eventId],
          ids: [eventId],
        }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!id) return;
    if (idsToVerify.length === 0) return;

    setBulkVerifying(true);
    setVerifyErr(null);

    try {
      const res = await fetch("/api/clinic-events/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          eventIds: idsToVerify,
          ids: idsToVerify,
        }),
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

    const base = (() => {
      if (filter === "all") return events;
      if (filter === "weight") return (events || []).filter((e) => extractWeightKg(e) !== null);
      if (filter === "document") {
        return (events || []).filter((e) => {
          const hasFiles = (filesCountByEventId?.[e.id] ?? 0) > 0;
          return e.type === "document" || hasFiles;
        });
      }
      return (events || []).filter((e) => e.type === filter);
    })();

    if (!q) return base;

    return base.filter((e) => {
      const hay = [e.title, e.description, e.type, e?.meta?.created_by_member_label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [events, filter, filesCountByEventId, search]);

  const shownEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleCount);
  }, [filteredEvents, visibleCount]);

  const hasMore = shownEvents.length < filteredEvents.length;

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

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Cartella clinica</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Timeline eventi (owner + pro) e stato validazione.
            </p>
          </div>

          {isVet ? (
            <Link
              href={`/professionisti/animali/${id}/verifica`}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Validazione (vet)
            </Link>
          ) : (
            <span className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600">
              Validazione riservata ai vet
            </span>
          )}
        </div>

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
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                  disabled={bulkVerifying}
                  onClick={() => selectAllPending()}
                >
                  Seleziona tutti
                </button>

                <button
                  type="button"
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                  disabled={bulkVerifying || selectedIds.size === 0}
                  onClick={() => void verifyMany(Array.from(selectedIds))}
                >
                  {bulkVerifying ? "Validazione…" : "Valida selezionati"}
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-50"
                  disabled={bulkVerifying}
                  onClick={() => void verifyMany(pendingIds)}
                  title="Valida tutti gli eventi in attesa"
                >
                  {bulkVerifying ? "Validazione…" : "Valida tutto"}
                </button>

                {selectedIds.size > 0 ? (
                  <button
                    type="button"
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                    disabled={bulkVerifying}
                    onClick={() => clearSelection()}
                  >
                    Azzera
                  </button>
                ) : null}
              </div>
            </div>

            <p className="mt-2 text-xs text-zinc-600">
              Suggerimento: puoi selezionare i singoli eventi “⏳ da validare” direttamente dalla
              timeline.
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Nuovo evento (PRO)</h2>
              <p className="mt-1 text-xs text-zinc-600">
                L’owner riceve il promemoria via email (push: in arrivo quando UNIMALIA sarà web
                app).
              </p>
            </div>
          </div>

          {saveErr ? (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {saveErr}
            </div>
          ) : null}

          {saveOk ? (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
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
                <option value="visit">Visita</option>
                <option value="vaccine">Vaccinazione</option>
                <option value="exam">Esame</option>
                <option value="therapy">Terapia</option>
                <option value="surgery">Intervento chirurgico</option>
                <option value="allergy">Allergia</option>
                <option value="feeding">Alimentazione</option>
                <option value="note">Nota</option>
                <option value="document">Documento</option>
                <option value="emergency">Emergenza</option>
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
              <span className={FIELD_LABEL_CLASS}>Allegati</span>
              <input
                type="file"
                multiple
                className={FILE_INPUT_CLASS}
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  setNewFiles(list);
                }}
              />
              {newFiles.length > 0 ? (
                <div className="mt-1 text-[11px] text-zinc-600">
                  📎 <span className="font-semibold">{newFiles.length}</span>
                </div>
              ) : null}
            </label>

            {newType === "therapy" ? (
              <div className="grid gap-4 md:grid-cols-12 md:col-span-12">
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
                  <p className="mt-1 text-xs text-zinc-500">
                    Se lasci vuoto, la terapia è considerata in corso.
                  </p>
                </label>
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
                <div className="mt-1 text-[11px] text-zinc-500">
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
                {saving ? "Salvataggio…" : "Salva evento"}
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
                      <button
                        type="button"
                        className={
                          reminderPresetDays === 15
                            ? "rounded-2xl border border-black bg-black px-3 py-2 text-sm font-semibold text-white"
                            : "rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                        }
                        onClick={() => onSuggestRecall(15)}
                      >
                        +15 giorni
                      </button>

                      <button
                        type="button"
                        className={
                          reminderPresetDays === 30
                            ? "rounded-2xl border border-black bg-black px-3 py-2 text-sm font-semibold text-white"
                            : "rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                        }
                        onClick={() => onSuggestRecall(30)}
                      >
                        +30 giorni
                      </button>

                      <button
                        type="button"
                        className={
                          reminderPresetDays === 180
                            ? "rounded-2xl border border-black bg-black px-3 py-2 text-sm font-semibold text-white"
                            : "rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                        }
                        onClick={() => onSuggestRecall(180)}
                      >
                        +6 mesi
                      </button>

                      <button
                        type="button"
                        className={
                          reminderPresetDays === 365
                            ? "rounded-2xl border border-black bg-black px-3 py-2 text-sm font-semibold text-white"
                            : "rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                        }
                        onClick={() => onSuggestRecall(365)}
                      >
                        +12 mesi
                      </button>
                    </div>
                  </div>
                ) : null}

                {newType === "vaccine" && remindAt ? (
                  <p className="md:col-span-2 text-xs text-zinc-600">
                    Nota vaccino: oltre al promemoria alla data impostata, l’owner verrà avvisato
                    anche <span className="font-semibold">15 giorni prima</span>.
                  </p>
                ) : null}

                <p className="md:col-span-2 text-xs text-zinc-600">
                  Nota: il promemoria verrà inviato{" "}
                  <span className="font-semibold">solo al proprietario</span>.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {eventsErr ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {eventsErr}
          </div>
        ) : null}

        {verifyErr ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {verifyErr}
          </div>
        ) : null}

        <div>
          <h2 className="text-base font-semibold text-zinc-900">Timeline clinica</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Eventi clinici in ordine cronologico, con stato validazione e dettagli principali subito visibili.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-700">
              Eventi totali: <span className="font-semibold">{events.length}</span> • Filtrati:{" "}
              <span className="font-semibold">{filteredEvents.length}</span> • Mostrati:{" "}
              <span className="font-semibold">{shownEvents.length}</span>
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

          <input
            type="text"
            className={FIELD_CLASS}
            placeholder="Cerca in note, descrizione, tipo evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {eventsLoading ? (
          <div className="text-sm text-zinc-600">Caricamento eventi…</div>
        ) : filteredEvents.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm leading-6 text-zinc-600">
            Nessun evento per questo filtro.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {shownEvents.map((ev) => {
              const isVerified =
                ev.source === "professional" || ev.source === "veterinarian" || !!ev.verified_at;

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
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        {!isVerified && isVet ? (
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4"
                            checked={isSelected}
                            onChange={() => toggleSelect(ev.id)}
                            title="Seleziona per validazione"
                          />
                        ) : null}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700">
                              {typeLabel(ev.type)}
                            </span>

                            <span>{formatEventDateIT(ev.event_date)}</span>

                            {ev.created_at ? (
                              <span className="text-zinc-400">
                                • Inserito il {formatInsertedAtIT(ev.created_at)}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 text-sm font-semibold leading-5 text-zinc-900">
                            {ev.title || typeLabel(ev.type)}
                            {evKg !== null ? (
                              <span
                                className="ml-2 inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700"
                                title="Peso registrato"
                              >
                                ⚖ {formatWeightLabel(evKg)}
                              </span>
                            ) : null}
                            {(filesCountByEventId[ev.id] ?? 0) > 0 ? (
                              <span
                                className="ml-2 inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700"
                                title={`Allegati: ${filesCountByEventId[ev.id]}`}
                              >
                                📎 {filesCountByEventId[ev.id]}
                              </span>
                            ) : null}
                          </div>

                          {ev.description ? (
                            <p className="mt-2 text-sm leading-6 text-zinc-700 line-clamp-3">
                              {ev.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                        {ev.visibility}
                      </span>

                      <div className="flex flex-col items-end gap-2">
                        {ev.source === "owner" ? (
                          <span className="text-xs font-medium text-zinc-600">
                            Creato da proprietario
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-zinc-600">
                            Registrato da{" "}
                            {ev?.meta?.created_by_member_label || ev.created_by_label || "Clinica"}
                          </span>
                        )}

                        {isVerified ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                            ✓ Validato
                          </span>
                        ) : (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                            ⏳ Da validare
                          </span>
                        )}
                      </div>

                      {!isVerified && isVet ? (
                        <button
                          type="button"
                          className="rounded-2xl bg-black px-3 py-2 text-[11px] font-semibold text-white hover:bg-zinc-900 disabled:opacity-50"
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

            {hasMore ? (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
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
          <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="p-6">
              {(() => {
                const allowed = detailEvent ? canEditOrDelete(detailEvent) : false;
                const kg = extractWeightKg(detailEvent);

                return (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold leading-6 text-zinc-900">
                          {detailEvent.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                            {typeLabel(detailEvent.type)}
                          </span>
                          <span>{formatEventDateIT(detailEvent.event_date)}</span>
                        </div>

                        <div className="mt-2 text-xs text-zinc-400">
                          Inserito il {formatInsertedAtIT(detailEvent.created_at)}
                        </div>

                        {kg !== null ? (
                          <div className="mt-2">
                            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                              ⚖ {formatWeightLabel(kg)}
                            </span>
                          </div>
                        ) : null}

                        {detailEvent.type === "therapy" ? (
                          <div className="mt-3 text-sm text-zinc-700 space-y-1">
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
                              className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
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
                              className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                              disabled={!allowed}
                              onClick={() => setDeleteConfirm(true)}
                              title={!allowed ? "Non autorizzato a eliminare questo evento" : ""}
                            >
                              Elimina
                            </button>

                            <button
                              type="button"
                              className="text-sm font-semibold text-zinc-600 hover:text-zinc-900"
                              onClick={closeDetailModal}
                            >
                              Chiudi ✕
                            </button>
                          </>
                        ) : (
                          <span className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700">
                            Modalità modifica
                          </span>
                        )}
                      </div>
                    </div>

                    {modalErr ? (
                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        {modalErr}
                      </div>
                    ) : null}

                    <div className="mt-6 space-y-4 text-sm max-h-[55vh] overflow-y-auto pr-1">
                      {!isEditing ? (
                        <>
                          {detailEvent.description ? (
                            <div>
                              <div className="text-xs font-semibold text-zinc-700">Descrizione</div>
                              <p className="mt-1 whitespace-pre-wrap text-zinc-800">
                                {detailEvent.description}
                              </p>
                            </div>
                          ) : null}

                          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <div className="text-xs font-semibold text-zinc-700">Allegati</div>

                            {detailFilesLoading ? (
                              <div className="mt-2 text-xs text-zinc-600">Caricamento…</div>
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

                            <label className="block mt-4">
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

                                  await fetch("/api/clinic-events/files/upload", {
                                    method: "POST",
                                    headers: {
                                      ...(await authHeaders()),
                                    },
                                    body: fd,
                                  });

                                  await loadClinicEvents();
                                  await loadFilesCount();

                                  try {
                                    const res = await fetch(
                                      `/api/clinic-events/files/list?eventId=${encodeURIComponent(
                                        detailEvent.id
                                      )}`,
                                      {
                                        cache: "no-store",
                                        headers: {
                                          ...(await authHeaders()),
                                        },
                                      }
                                    );
                                    const j = await res.json().catch(() => ({}));
                                    setDetailFiles((j?.files as any[]) ?? []);
                                  } catch {
                                    // no-op
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

                            <div className="mt-2 space-y-1 text-xs text-zinc-600">
                              <div>
                                ID evento: <span className="font-mono">{detailEvent.id}</span>
                              </div>
                              <div>Visibilità: {detailEvent.visibility}</div>
                              <div>Fonte: {detailEvent.source}</div>
                              {detailEvent.created_by_label ? (
                                <div>Creato da: {detailEvent.created_by_label}</div>
                              ) : null}
                              {detailEvent.verified_at ? (
                                <div>Validato il: {formatDateIT(detailEvent.verified_at)}</div>
                              ) : null}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
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
                                  <option value="visit">Visita</option>
                                  <option value="vaccine">Vaccinazione</option>
                                  <option value="exam">Esame</option>
                                  <option value="therapy">Terapia</option>
                                  <option value="surgery">Intervento chirurgico</option>
                                  <option value="allergy">Allergia</option>
                                  <option value="feeding">Alimentazione</option>
                                  <option value="note">Nota</option>
                                  <option value="document">Documento</option>
                                  <option value="emergency">Emergenza</option>
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

                            <p className="mt-3 text-xs text-zinc-600">
                              Nota: il peso è salvato in “meta” e non è ancora modificabile da
                              questa schermata.
                            </p>
                          </div>
                        </>
                      )}

                      {deleteConfirm ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                          <div className="text-sm font-semibold text-red-800">
                            Conferma eliminazione
                          </div>
                          <p className="mt-1 text-sm text-red-800">
                            Vuoi eliminare questo evento? L’azione sarà tracciata nello storico
                            (quando attiviamo l’audit log).
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                              onClick={() => setDeleteConfirm(false)}
                              disabled={deleting}
                            >
                              Chiudi
                            </button>

                            <button
                              type="button"
                              className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              disabled={!allowed || deleting}
                              onClick={() => void deleteDetailEvent()}
                            >
                              {deleting ? "Eliminazione…" : "Conferma eliminazione"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                      {isEditing ? (
                        isDetailDirty ? (
                          <>
                            <button
                              type="button"
                              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
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
                            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                            onClick={closeDetailModal}
                          >
                            Chiudi
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
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