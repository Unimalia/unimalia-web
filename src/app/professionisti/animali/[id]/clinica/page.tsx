"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isVetUser } from "@/app/professionisti/_components/ProShell";
import { authHeaders } from "@/lib/client/authHeaders";

type ClinicEventType =
  | "visit"
  | "vaccine"
  | "exam"
  | "therapy"
  | "note"
  | "document"
  | "emergency";

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

  verified_by_label?: string | null;
  verified_by_org_id?: string | null;
  verified_by_member_id?: string | null;
};

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
    default:
      return t;
  }
}

function formatDateIT(iso: string) {
  try {
    return new Date(iso).toLocaleString("it-IT", {
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

export default function ProAnimalClinicPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [isVet, setIsVet] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [eventsLoading, setEventsLoading] = useState(false);
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [eventsErr, setEventsErr] = useState<string | null>(null);

  // Nuovo evento (UI only, per ora)
  const [newType, setNewType] = useState<ClinicEventType>("visit");
  const [newDate, setNewDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  // ✅ Validazione
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkVerifying, setBulkVerifying] = useState(false);

  // ✅ Evento selezionato (modal dettagli)
  const [detailEvent, setDetailEvent] = useState<ClinicEventRow | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // campi edit (UI only)
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<ClinicEventType>("visit");
  const [editDate, setEditDate] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [modalErr, setModalErr] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Promemoria owner
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

  useEffect(() => {
    void loadClinicEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      const payload = {
        animalId: id,
        eventDate: newDate,
        type: newType,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        visibility: "owner" as const,
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

      // Inserimento immediato in UI (così lo vedi anche se la list ha delay/cache)
      if (json?.event) {
        setEvents((prev) => [json.event as ClinicEventRow, ...prev]);
      }

      setNewTitle("");
      setNewDesc("");

      // Reset promemoria UI (per ora non salviamo reminders)
      setReminderEnabled(false);
      setRemindAt("");
      setReminderPresetDays(null);

      // Refresh reale dal server
      await loadClinicEvents();
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
        // mando più chiavi per essere compatibile con implementazioni diverse
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

      // Update ottimistico: segna validato subito in UI
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

      // Refresh reale
      await loadClinicEvents();
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

      // Update ottimistico: segna validati in UI
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
    } catch {
      setVerifyErr("Errore di rete durante la validazione.");
    } finally {
      setBulkVerifying(false);
    }
  }

  function canEditOrDelete(ev: ClinicEventRow) {
    // PRO/VET possono sempre modificare eventi owner
    if (ev.source === "owner") return true;

    // Per eventi pro/vet: serve creator id.
    // Se non abbiamo created_by, per sicurezza NON permettiamo edit/delete (evita che pro X tocchi pro Y).
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
    } catch {
      setModalErr("Errore di rete durante l’eliminazione.");
    } finally {
      setDeleting(false);
    }
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

        {/* NUOVO EVENTO (PRO) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Nuovo evento (PRO)</h2>
              <p className="mt-1 text-xs text-zinc-600">
                L’owner riceve il promemoria via email (push: in arrivo quando UNIMALIA sarà web app).
              </p>
            </div>

            <button
              type="button"
              className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-50"
              disabled={saving || !newTitle.trim() || !newDate}
              onClick={() => void saveClinicEvent()}
            >
              {saving ? "Salvataggio…" : "Salva evento"}
            </button>
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

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="text-xs font-semibold text-zinc-700">Tipo evento</div>
              <select
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value as ClinicEventType)}
              >
                <option value="visit">Visita</option>
                <option value="vaccine">Vaccinazione</option>
                <option value="exam">Esame</option>
                <option value="therapy">Terapia</option>
                <option value="note">Nota</option>
                <option value="document">Documento</option>
                <option value="emergency">Emergenza</option>
              </select>
            </label>

            <label className="block">
              <div className="text-xs font-semibold text-zinc-700">Data evento</div>
              <input
                type="date"
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </label>

            <label className="block md:col-span-2">
              <div className="text-xs font-semibold text-zinc-700">Titolo</div>
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Es. Vaccino annuale / Visita controllo / Terapia…"
              />
            </label>

            <label className="block md:col-span-2">
              <div className="text-xs font-semibold text-zinc-700">Descrizione (opzionale)</div>
              <textarea
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Dettagli clinici, note, dosaggi, ecc."
              />
            </label>
          </div>

          {/* PROMEMORIA */}
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
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="block">
                  <div className="text-xs font-semibold text-zinc-700">Data promemoria</div>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    value={remindAt}
                    onChange={(e) => {
                      setRemindAt(e.target.value);
                      setReminderPresetDays(null);
                    }}
                  />
                </label>

                <div className="block">
                  <div className="text-xs font-semibold text-zinc-700">Canali</div>
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
                    Nota vaccino: oltre al promemoria alla data impostata, l’owner verrà avvisato anche{" "}
                    <span className="font-semibold">15 giorni prima</span>.
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

        {eventsLoading ? (
          <div className="text-sm text-zinc-600">Caricamento eventi…</div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
            Nessun evento disponibile (o non autorizzato).
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((ev) => {
              const isVerified =
                ev.source === "professional" || ev.source === "veterinarian" || !!ev.verified_at;

              const isSelected = selectedIds.has(ev.id);

              const verifierLabel =
                (ev.verified_by_label && ev.verified_by_label.trim()) ||
                (isVerified ? "Veterinario" : null);

              return (
                <div
                  key={ev.id}
                  className="rounded-2xl border border-zinc-200 p-4 cursor-pointer hover:border-zinc-400 transition"
                  onClick={() => {
                    setDetailEvent(ev);
                    setIsEditing(false);
                    setDeleteConfirm(false);
                    setModalErr(null);

                    setEditTitle(ev.title || "");
                    setEditType(ev.type);
                    setEditDate((ev.event_date || "").slice(0, 10)); // YYYY-MM-DD
                    setEditDesc(ev.description || "");
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
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
                          <div className="text-xs text-zinc-500">{formatDateIT(ev.event_date)}</div>

                          <div className="mt-1 truncate text-sm font-semibold text-zinc-900">
                            {ev.title || typeLabel(ev.type)}
                          </div>

                          <div className="mt-1 text-xs text-zinc-600">{typeLabel(ev.type)}</div>

                          {ev.description ? (
                            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                              {ev.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
                        {ev.visibility}
                      </span>

                      {isVerified ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          ✓ Validato {verifierLabel ? `da ${verifierLabel}` : ""}
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            ⏳ Da validare
                          </span>

                          {isVet ? (
                            <button
                              type="button"
                              className="rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-900 disabled:opacity-50"
                              disabled={verifyingId === ev.id}
                              onClick={() => void verifyEvent(ev.id)}
                              title="Valida questo evento"
                            >
                              {verifyingId === ev.id ? "Validazione…" : "Valida"}
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {detailEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            {(() => {
              const allowed = detailEvent ? canEditOrDelete(detailEvent) : false;

              return (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900">
                        {detailEvent.title || typeLabel(detailEvent.type)}
                      </h2>
                      <div className="mt-1 text-xs text-zinc-600">
                        {typeLabel(detailEvent.type)} • {formatDateIT(detailEvent.event_date)}
                      </div>
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
                        </>
                      ) : (
                        <span className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700">
                          Modalità modifica
                        </span>
                      )}

                      <button
                        type="button"
                        className="text-sm font-semibold text-zinc-600 hover:text-zinc-900"
                        onClick={() => {
                          setDetailEvent(null);
                          setIsEditing(false);
                          setDeleteConfirm(false);
                          setModalErr(null);
                        }}
                      >
                        Chiudi ✕
                      </button>
                    </div>
                  </div>

                  {modalErr ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      {modalErr}
                    </div>
                  ) : null}

                  <div className="mt-6 space-y-4 text-sm">
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

                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                          <div className="text-xs font-semibold text-zinc-700">Stato validazione</div>

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
                          <div className="text-xs font-semibold text-zinc-700">Meta informazioni</div>

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

                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <label className="block md:col-span-2">
                              <div className="text-xs font-semibold text-zinc-700">Titolo</div>
                              <input
                                type="text"
                                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                              />
                            </label>

                            <label className="block">
                              <div className="text-xs font-semibold text-zinc-700">Tipo</div>
                              <select
                                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                                value={editType}
                                onChange={(e) => setEditType(e.target.value as ClinicEventType)}
                              >
                                <option value="visit">Visita</option>
                                <option value="vaccine">Vaccinazione</option>
                                <option value="exam">Esame</option>
                                <option value="therapy">Terapia</option>
                                <option value="note">Nota</option>
                                <option value="document">Documento</option>
                                <option value="emergency">Emergenza</option>
                              </select>
                            </label>

                            <label className="block">
                              <div className="text-xs font-semibold text-zinc-700">Data</div>
                              <input
                                type="date"
                                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                              />
                            </label>

                            <label className="block md:col-span-2">
                              <div className="text-xs font-semibold text-zinc-700">Descrizione</div>
                              <textarea
                                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                                rows={4}
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                              />
                            </label>
                          </div>

                          <p className="mt-3 text-xs text-zinc-600">
                            Nota: quando abilitiamo l’audit log, ogni modifica verrà registrata e, se
                            l’owner modifica un evento validato, potrà tornare “⏳ da validare”.
                          </p>
                        </div>
                      </>
                    )}

                    {/* Conferma eliminazione */}
                    {deleteConfirm ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                        <div className="text-sm font-semibold text-red-800">Conferma eliminazione</div>
                        <p className="mt-1 text-sm text-red-800">
                          Vuoi eliminare questo evento? L’azione sarà tracciata nello storico (quando
                          attiviamo l’audit log).
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                            onClick={() => setDeleteConfirm(false)}
                            disabled={deleting}
                          >
                            Annulla
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
                      <>
                        <button
                          type="button"
                          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                          onClick={() => {
                            // ripristina valori originali
                            setEditTitle(detailEvent?.title || "");
                            setEditType(detailEvent?.type || "visit");
                            setEditDate((detailEvent?.event_date || "").slice(0, 10));
                            setEditDesc(detailEvent?.description || "");
                            setIsEditing(false);
                            setDeleteConfirm(false);
                            setModalErr(null);
                          }}
                          disabled={updating}
                        >
                          Annulla
                        </button>

                        <button
                          type="button"
                          className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-50"
                          disabled={!allowed || updating || !editTitle.trim() || !editDate}
                          onClick={() => void updateDetailEvent()}
                        >
                          {updating ? "Salvataggio…" : "Conferma modifica"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                        onClick={() => {
                          setDetailEvent(null);
                          setIsEditing(false);
                          setDeleteConfirm(false);
                          setModalErr(null);
                        }}
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
      ) : null}
    </div>
  );
}