"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
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
      setNewTitle("");
      setNewDesc("");

      // Reset promemoria UI (per ora non salviamo reminders)
      setReminderEnabled(false);
      setRemindAt("");
      setReminderPresetDays(null);

      await loadClinicEvents();
    } catch {
      setSaveErr("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
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

              const verifierLabel =
                (ev.verified_by_label && ev.verified_by_label.trim()) ||
                (isVerified ? "Veterinario" : null);

              return (
                <div key={ev.id} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-zinc-500">{formatDateIT(ev.event_date)}</div>
                      <div className="mt-1 truncate text-sm font-semibold text-zinc-900">
                        {typeLabel(ev.type)}
                      </div>
                      {ev.description ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                          {ev.description}
                        </p>
                      ) : null}
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
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          ⏳ Da validare
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}