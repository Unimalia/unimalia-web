"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "@/_components/ui/page-shell";
import { ButtonSecondary, ButtonPrimary } from "@/_components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { authHeaders } from "@/lib/client/authHeaders";

type ClinicEventType =
  | "visit"
  | "vaccine"
  | "exam"
  | "therapy"
  | "note"
  | "document"
  | "emergency"
  | "allergy"
  | "feeding"
  | "surgery";

type EventMetaLike = {
  therapy_start_date?: string | null;
  therapy_end_date?: string | null;
  weight_kg?: number | string | null;
  weightKg?: number | string | null;
  created_by_member_label?: string | null;
};

type EventExtraDataLike = {
  weight_kg?: number | string | null;
  weightKg?: number | string | null;
};

type ClinicEventRow = {
  id: string;
  animal_id: string;
  event_date: string;
  type: ClinicEventType;
  title: string;
  description: string | null;
  visibility: "owner" | "professionals" | "emergency";
  source: "owner" | "professional";
  verified_at: string | null;
  verified_by_user_id: string | null;
  created_at: string;
  created_by_user_id?: string | null;
  verified_by_label?: string | null;
  verified_by_organization_id?: string | null;
  verified_by_member_id?: string | null;
  weight_kg?: number | string | null;
  weightKg?: number | string | null;
  meta?: EventMetaLike | null;
  data?: EventExtraDataLike | null;
  payload?: EventExtraDataLike | null;
};

type EventFileRow = {
  id: string;
  filename: string;
  mime?: string | null;
  path?: string | null;
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
  { key: "allergy", label: "Allergie" },
  { key: "feeding", label: "Alimentazione" },
  { key: "surgery", label: "Intervento chirurgico" },
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
    case "note":
      return "Nota";
    case "document":
      return "Documento";
    case "emergency":
      return "Emergenza";
    case "allergy":
      return "Allergia";
    case "feeding":
      return "Alimentazione";
    case "surgery":
      return "Intervento chirurgico";
    default:
      return t;
  }
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

function formatEventDateIT(dateStr?: string | null) {
  if (!dateStr) return "â€”";

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

  return new Date(s).toLocaleDateString("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatInsertedAtIT(iso?: string | null) {
  if (!iso) return "â€”";

  return new Date(iso).toLocaleString("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractWeightKg(e: ClinicEventRow | null | undefined): number | null {
  if (!e) return null;

  const direct =
    e.weight_kg ??
    e.weightKg ??
    e.meta?.weight_kg ??
    e.meta?.weightKg ??
    e.data?.weightKg ??
    e.data?.weight_kg ??
    e.payload?.weightKg ??
    e.payload?.weight_kg;

  if (direct === null || direct === undefined) return null;

  const n = typeof direct === "number" ? direct : Number(String(direct).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;

  return Math.round(n * 10) / 10;
}

function extractTherapyStartDate(e: ClinicEventRow | null | undefined): string | null {
  return e?.meta?.therapy_start_date || null;
}

function extractTherapyEndDate(e: ClinicEventRow | null | undefined): string | null {
  return e?.meta?.therapy_end_date || null;
}

function toDateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDateTimeLocalValue(v: string) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function AnimalClinicalPage() {
  const params = useParams<{ id: string }>();
  const animalId = params?.id;

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<ClinicEventType>("note");
  const [description, setDescription] = useState("");
  const [dateLocal, setDateLocal] = useState(() => toDateTimeLocalValue(new Date()));
  const [therapyStartDate, setTherapyStartDate] = useState("");
  const [therapyEndDate, setTherapyEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [filesErr, setFilesErr] = useState<string | null>(null);

  const [detailEvent, setDetailEvent] = useState<ClinicEventRow | null>(null);
  const [detailFiles, setDetailFiles] = useState<EventFileRow[]>([]);
  const [detailFilesLoading, setDetailFilesLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<ClinicEventType>("note");
  const [editDateLocal, setEditDateLocal] = useState(() => toDateTimeLocalValue(new Date()));
  const [editDescription, setEditDescription] = useState("");
  const [editTherapyStartDate, setEditTherapyStartDate] = useState("");
  const [editTherapyEndDate, setEditTherapyEndDate] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateErr, setUpdateErr] = useState<string | null>(null);

  const [filesCountByEventId, setFilesCountByEventId] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<FilterKey>("all");

  const backHref = useMemo(() => (animalId ? `/identita/${animalId}` : "/identita"), [animalId]);

  const loadEvents = useCallback(async () => {
    if (!animalId) return;

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from("animal_clinic_events")
      .select(
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by_user_id, created_at, created_by_user_id, verified_by_label, verified_by_organization_id, verified_by_member_id, meta, status"
      )
      .eq("animal_id", animalId)
      .neq("status", "void")
      .order("event_date", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setEvents([]);
    } else {
      setEvents((data as ClinicEventRow[]) ?? []);
    }

    setLoading(false);
  }, [animalId]);

  const loadFilesCount = useCallback(async () => {
    if (!animalId) return;

    try {
      const res = await fetch(
        `/api/clinic-events/files/count?animalId=${encodeURIComponent(animalId)}`,
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
  }, [animalId]);

  const loadDetailFiles = useCallback(async (eventId: string) => {
    setDetailFilesLoading(true);
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
      setDetailFiles((j?.files as EventFileRow[]) ?? []);
    } catch {
      setDetailFiles([]);
    } finally {
      setDetailFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadEvents();
      await loadFilesCount();
    })();
  }, [loadEvents, loadFilesCount]);

  useEffect(() => {
    if (!detailEvent?.id) {
      setDetailFiles([]);
      return;
    }
    void loadDetailFiles(detailEvent.id);
  }, [detailEvent?.id, loadDetailFiles]);

  async function uploadFilesForEvent(eventId: string) {
    if (!animalId) return;
    if (files.length === 0) return;

    setFilesErr(null);

    const bucket = "clinic-event-files";

    for (const f of files) {
      const safeName = (f.name || "documento").replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
      const path = `${animalId}/${eventId}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, f, {
        contentType: f.type || undefined,
        upsert: false,
      });

      if (upErr) {
        setFilesErr("Evento salvato, ma caricamento allegati non riuscito.");
        return;
      }

      const { error: insErr } = await supabase.from("animal_clinic_event_files").insert({
        event_id: eventId,
        animal_id: animalId,
        path,
        filename: f.name || safeName,
        mime: f.type || null,
        size: f.size || null,
      });

      if (insErr) {
        setFilesErr("Evento salvato, ma collegamento allegati non riuscito.");
        return;
      }
    }
  }

  async function onAddEvent() {
    if (!animalId) return;

    const cleanDescription = description.trim();

    setSaving(true);
    setError(null);
    setFilesErr(null);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      setSaving(false);
      setError("Devi essere autenticato per modificare la cartella clinica.");
      return;
    }

    const eventDate = fromDateTimeLocalValue(dateLocal).toISOString();
    const title = typeLabel(type);

    const meta: EventMetaLike = {};

    if (type === "therapy") {
      if (therapyStartDate) meta.therapy_start_date = therapyStartDate;
      meta.therapy_end_date = therapyEndDate || null;
    }

    const payload = {
      animal_id: animalId,
      event_date: eventDate,
      type,
      title,
      description: cleanDescription || null,
      visibility: "owner" as const,
      created_by_user_id: sessionData.session.user.id,
      source: "owner" as const,
      verified_at: null,
      verified_by_user_id: null,
      meta,
    };

    const { data: inserted, error: insErr } = await supabase
      .from("animal_clinic_events")
      .insert(payload)
      .select("id")
      .single();

    if (insErr || !inserted?.id) {
      setSaving(false);
      setError(insErr?.message || "Errore inserimento evento.");
      return;
    }

    if (files.length > 0) {
      await uploadFilesForEvent(inserted.id);
    }

    setDescription("");
    setType("note");
    setDateLocal(toDateTimeLocalValue(new Date()));
    setTherapyStartDate("");
    setTherapyEndDate("");
    setFiles([]);

    await loadEvents();
    await loadFilesCount();
    setSaving(false);
  }

  async function onUpdateEvent() {
    if (!detailEvent) return;

    setUpdating(true);
    setUpdateErr(null);

    try {
      const res = await fetch("/api/clinic-events/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          id: detailEvent.id,
          title: typeLabel(editType),
          type: editType,
          eventDate: fromDateTimeLocalValue(editDateLocal).toISOString(),
          description: editDescription.trim() || null,
          therapyStartDate: editType === "therapy" ? editTherapyStartDate || null : null,
          therapyEndDate: editType === "therapy" ? editTherapyEndDate || null : null,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setUpdateErr(json?.error || "Errore modifica evento.");
        return;
      }

      await loadEvents();
      await loadFilesCount();

      const refreshed = (json?.event as ClinicEventRow | undefined) ?? null;
      if (refreshed) {
        setDetailEvent(refreshed);
      } else {
        setDetailEvent((prev) =>
          prev
            ? {
                ...prev,
                type: editType,
                title: typeLabel(editType),
                event_date: fromDateTimeLocalValue(editDateLocal).toISOString(),
                description: editDescription.trim() || null,
                verified_at: null,
                verified_by_user_id: null,
                meta: {
                  ...(prev.meta || {}),
                  therapy_start_date: editType === "therapy" ? editTherapyStartDate || null : null,
                  therapy_end_date: editType === "therapy" ? editTherapyEndDate || null : null,
                },
              }
            : null
        );
      }

      setIsEditing(false);
    } catch {
      setUpdateErr("Errore di rete durante la modifica.");
    } finally {
      setUpdating(false);
    }
  }

  const filteredEvents = useMemo(() => {
    if (filter === "document") {
      return (events || []).filter((e) => {
        const hasFiles = (filesCountByEventId?.[e.id] ?? 0) > 0;
        return e.type === "document" || hasFiles;
      });
    }

    if (filter === "weight") {
      return (events || []).filter((e) => extractWeightKg(e) !== null);
    }

    if (filter === "all") return events;

    return (events || []).filter((e) => e.type === filter);
  }, [events, filter, filesCountByEventId]);

  const initialEditDateLocal = detailEvent
    ? toDateTimeLocalValue(new Date(detailEvent.event_date))
    : "";

  const initialEditDescription = detailEvent?.description || "";
  const initialEditTherapyStartDate = detailEvent ? extractTherapyStartDate(detailEvent) || "" : "";
  const initialEditTherapyEndDate = detailEvent ? extractTherapyEndDate(detailEvent) || "" : "";

  const isEditDirty =
    !!detailEvent &&
    (editType !== detailEvent.type ||
      editDateLocal !== initialEditDateLocal ||
      editDescription !== initialEditDescription ||
      editTherapyStartDate !== initialEditTherapyStartDate ||
      editTherapyEndDate !== initialEditTherapyEndDate);

  return (
    <PageShell
      title="Cartella clinica"
      subtitle="Referti, vaccinazioni, terapie, note."
      backFallbackHref={backHref}
      actions={
        <>
          <ButtonSecondary href={backHref}>Torna alla scheda</ButtonSecondary>
          <ButtonPrimary href="/professionisti/richieste">Richieste consulto</ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Nuovo evento</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Inserisci un evento (anche storico). La descrizione Ã¨ facoltativa.
              </p>
            </div>

            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-500">
              Owner-only
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
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

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                Categoria
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                value={type}
                onChange={(e) => setType(e.target.value as ClinicEventType)}
              >
                <option value="note">Nota</option>
                <option value="visit">Visita</option>
                <option value="vaccine">Vaccinazione</option>
                <option value="exam">Esame</option>
                <option value="therapy">Terapia</option>
                <option value="allergy">Allergia</option>
                <option value="feeding">Alimentazione</option>
                <option value="surgery">Intervento chirurgico</option>
                <option value="emergency">Emergenza</option>
                <option value="document">Documento</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                Data e ora
              </label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                value={dateLocal}
                onChange={(e) => setDateLocal(e.target.value)}
              />
              <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                Precompilata con lâ€™orario attuale. Modificabile per caricare eventi storici.
              </p>
            </div>

            {type === "therapy" ? (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                    Inizio terapia
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    value={therapyStartDate}
                    onChange={(e) => setTherapyStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                    Fine terapia
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    value={therapyEndDate}
                    onChange={(e) => setTherapyEndDate(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                    Se lasci vuoto, la terapia Ã¨ considerata in corso.
                  </p>
                </div>
              </>
            ) : null}

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                Descrizione (facoltativa)
              </label>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Dettagli utili (farmaco, dosaggio, note cliniche, etichetta ingredienti, sospetta allergia)â€¦"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                Allegati (opzionale)
              </label>

              <div className="mt-1">
                <label className="inline-flex cursor-pointer items-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
                  <span>Carica file</span>
                  <input
                    type="file"
                    className="sr-only"
                    multiple
                    onChange={(e) => {
                      const list = Array.from(e.target.files || []);
                      setFiles(list);
                    }}
                  />
                </label>
              </div>

              {files.length > 0 ? (
                <p className="mt-2 text-sm text-gray-600">{files.length} file selezionati</p>
              ) : (
                <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                  Puoi allegare uno o piÃ¹ documenti: referti, esami, PDF, immagini o etichette
                  ingredienti.
                </p>
              )}
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-700">
              {error}
            </div>
          ) : null}

          {filesErr ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm leading-6 text-amber-900">
              {filesErr}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAddEvent}
              disabled={saving || !animalId}
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-900 disabled:opacity-60"
            >
              {saving ? "Salvataggio..." : "Aggiungi evento"}
            </button>

            <Link
              href="/professionisti/richieste"
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Condividi con professionista (poi)
            </Link>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Nota: gli allegati vengono associati allâ€™evento e sono visibili nel dettaglio evento.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-base font-semibold text-zinc-900">Timeline clinica</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Eventi clinici in ordine cronologico, con stato validazione e dettagli principali subito
            visibili.
          </p>

          {loading ? (
            <div className="mt-4 text-sm text-zinc-600">Caricamento...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm leading-6 text-zinc-600">
              Nessun evento ancora. Aggiungi il primo evento per iniziare la timeline.
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {filteredEvents.map((ev) => {
                const isVerified = ev.source === "professional" || !!ev.verified_at;
                const weightKg = extractWeightKg(ev);

                let statusTextTop = "";
                let statusTextBadge = "";

                if (ev.source === "owner") {
                  if (ev.verified_at && ev.verified_by_label) {
                    statusTextTop = "Creato da proprietario";
                    statusTextBadge = `âœ“ Validato da ${ev.verified_by_label}`;
                  } else if (ev.verified_at) {
                    statusTextTop = "Creato da proprietario";
                    statusTextBadge = "âœ“ Validato";
                  } else {
                    statusTextTop = "Creato da proprietario";
                    statusTextBadge = "â³ Da validare";
                  }
                } else {
                  statusTextTop = `Registrato da ${ev.meta?.created_by_member_label || "professionista"}`;
                  statusTextBadge = isVerified ? "âœ“ Validato" : "â³ Da rivalidare";
                }

                return (
                  <div
                    key={ev.id}
                    className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                    onClick={() => {
                      setDetailEvent(ev);
                      setIsEditing(false);
                      setUpdateErr(null);
                      setEditType(ev.type);
                      setEditDateLocal(toDateTimeLocalValue(new Date(ev.event_date)));
                      setEditDescription(ev.description || "");
                      setEditTherapyStartDate(extractTherapyStartDate(ev) || "");
                      setEditTherapyEndDate(extractTherapyEndDate(ev) || "");
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700">
                            {typeLabel(ev.type)}
                          </span>

                          <span>{formatEventDateIT(ev.event_date)}</span>

                          {ev.created_at ? (
                            <span className="text-zinc-400">
                              â€¢ Inserito il {formatInsertedAtIT(ev.created_at)}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 text-sm font-semibold leading-5 text-zinc-900">
                          {ev.title || typeLabel(ev.type)}
                          {weightKg !== null ? (
                            <span className="ml-2 inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700">
                              âš– {weightKg} kg
                            </span>
                          ) : null}
                        </div>

                        {ev.description ? (
                          <p className="mt-2 text-sm leading-6 text-zinc-700 line-clamp-3">
                            {ev.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                          {visibilityLabel(ev.visibility)}
                        </span>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs font-medium text-zinc-600">{statusTextTop}</span>

                          <span
                            className={
                              isVerified
                                ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                : "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                            }
                          >
                            {statusTextBadge}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {detailEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl md:p-6">
            <div className="flex items-start justify-between gap-3">
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
              </div>

              <button
                type="button"
                className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                onClick={() => {
                  setDetailEvent(null);
                  setIsEditing(false);
                  setUpdateErr(null);
                }}
              >
                Chiudi
              </button>
            </div>

            {extractWeightKg(detailEvent) !== null ? (
              <div className="mt-4 text-sm leading-6 text-zinc-700">
                <span className="font-semibold">Peso:</span> âš– {extractWeightKg(detailEvent)} kg
              </div>
            ) : null}

            {detailEvent.type === "therapy" ? (
              <div className="mt-3 space-y-1.5 text-sm leading-6 text-zinc-700">
                <div>
                  <span className="font-semibold">Inizio terapia:</span>{" "}
                  {extractTherapyStartDate(detailEvent) || "â€”"}
                </div>
                <div>
                  <span className="font-semibold">Fine terapia:</span>{" "}
                  {extractTherapyEndDate(detailEvent) || "In corso"}
                </div>
              </div>
            ) : null}

            <div className="mt-4 text-sm leading-6 text-zinc-700">
              <span className="font-semibold">Creatore evento:</span>{" "}
              {detailEvent.source === "owner"
                ? "Proprietario"
                : detailEvent.meta?.created_by_member_label || "Professionista"}
            </div>

            <div className="mt-2 text-sm leading-6 text-zinc-700">
              <span className="font-semibold">Stato validazione:</span>{" "}
              {detailEvent.verified_at
                ? detailEvent.verified_by_label
                  ? `âœ“ Validato da ${detailEvent.verified_by_label}`
                  : "âœ“ Validato"
                : detailEvent.source === "professional"
                  ? "â³ Da rivalidare"
                  : "â³ Da validare"}
            </div>

            {detailEvent.description ? (
              <p className="mt-4 text-sm leading-6 text-zinc-700 whitespace-pre-wrap">
                {detailEvent.description}
              </p>
            ) : null}

            <div className="mt-4">
              <div className="text-xs font-semibold text-zinc-700">Allegati</div>

              {detailFilesLoading ? (
                <div className="mt-1 text-xs text-zinc-500">Caricamento...</div>
              ) : detailFiles.length === 0 ? (
                <div className="mt-1 text-xs text-zinc-500">Nessun allegato</div>
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
            </div>

            <label className="mt-3 inline-flex cursor-pointer items-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
              <span>Carica file</span>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={async (e) => {
                  if (!detailEvent) return;

                  const selectedFiles = Array.from(e.target.files || []);
                  if (!selectedFiles.length) return;

                  const fd = new FormData();
                  fd.append("eventId", detailEvent.id);
                  fd.append("animalId", detailEvent.animal_id);

                  for (const f of selectedFiles) fd.append("files", f);

                  await fetch("/api/clinic-events/files/upload", {
                    method: "POST",
                    headers: {
                      ...(await authHeaders()),
                    },
                    body: fd,
                  });

                  await loadEvents();
                  await loadFilesCount();
                  await loadDetailFiles(detailEvent.id);

                  e.currentTarget.value = "";
                }}
              />
            </label>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                onClick={() => {
                  setIsEditing((v) => !v);
                  setUpdateErr(null);
                  setEditType(detailEvent.type);
                  setEditDateLocal(toDateTimeLocalValue(new Date(detailEvent.event_date)));
                  setEditDescription(detailEvent.description || "");
                  setEditTherapyStartDate(extractTherapyStartDate(detailEvent) || "");
                  setEditTherapyEndDate(extractTherapyEndDate(detailEvent) || "");
                }}
              >
                Modifica evento
              </button>
            </div>

            {isEditing ? (
              <div className="mt-4 rounded-xl border border-zinc-200 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Tipo
                    </label>
                    <select
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as ClinicEventType)}
                    >
                      <option value="note">Nota</option>
                      <option value="visit">Visita</option>
                      <option value="vaccine">Vaccinazione</option>
                      <option value="exam">Esame</option>
                      <option value="therapy">Terapia</option>
                      <option value="allergy">Allergia</option>
                      <option value="feeding">Alimentazione</option>
                      <option value="surgery">Intervento chirurgico</option>
                      <option value="emergency">Emergenza</option>
                      <option value="document">Documento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Data evento
                    </label>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                      value={editDateLocal}
                      onChange={(e) => setEditDateLocal(e.target.value)}
                    />
                  </div>

                  {editType === "therapy" ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                          Inizio terapia
                        </label>
                        <input
                          type="date"
                          className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                          value={editTherapyStartDate}
                          onChange={(e) => setEditTherapyStartDate(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                          Fine terapia
                        </label>
                        <input
                          type="date"
                          className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                          value={editTherapyEndDate}
                          onChange={(e) => setEditTherapyEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Titolo
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
                      value={typeLabel(editType)}
                      readOnly
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Descrizione
                    </label>
                    <textarea
                      className="mt-1 min-h-[120px] w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                </div>

                {updateErr ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-700">
                    {updateErr}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!isEditDirty) {
                        setIsEditing(false);
                        setUpdateErr(null);
                        return;
                      }

                      await onUpdateEvent();
                    }}
                    disabled={updating}
                    className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-900 disabled:opacity-60"
                  >
                    {updating ? "Salvataggio..." : isEditDirty ? "Salva e chiudi" : "Chiudi"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!detailEvent) return;
                      setEditType(detailEvent.type);
                      setEditDateLocal(toDateTimeLocalValue(new Date(detailEvent.event_date)));
                      setEditDescription(detailEvent.description || "");
                      setEditTherapyStartDate(extractTherapyStartDate(detailEvent) || "");
                      setEditTherapyEndDate(extractTherapyEndDate(detailEvent) || "");
                      setUpdateErr(null);
                      setIsEditing(false);
                    }}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    Annulla modifiche
                  </button>
                </div>

                <p className="mt-3 text-xs text-zinc-500">
                  Se modifichi un evento giÃ  validato o creato dal professionista, il backend deve
                  riportarlo a â€œâ³ Da rivalidareâ€.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}