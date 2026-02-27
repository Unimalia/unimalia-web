"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "@/_components/ui/page-shell";
import { ButtonSecondary, ButtonPrimary } from "@/_components/ui/button";
import { supabase } from "@/lib/supabaseClient";

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
  event_date: string; // timestamptz
  type: ClinicEventType;
  title: string;
  description: string | null;
  visibility: "owner" | "professionals" | "emergency";
  source: "owner" | "professional";
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
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

// datetime-local helpers
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
  // v: "YYYY-MM-DDTHH:mm"
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function AnimalClinicalPage() {
  const params = useParams<{ id: string }>();
  const animalId = params?.id;

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [type, setType] = useState<ClinicEventType>("note");
  const [description, setDescription] = useState("");
  const [dateLocal, setDateLocal] = useState(() => toDateTimeLocalValue(new Date()));
  const [saving, setSaving] = useState(false);

  const backHref = useMemo(() => (animalId ? `/identita/${animalId}` : "/identita"), [animalId]);

  async function loadEvents() {
    if (!animalId) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("animal_clinic_events")
      .select(
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by, created_at"
      )
      .eq("animal_id", animalId)
      .order("event_date", { ascending: false });

    if (error) {
      setError(error.message);
      setEvents([]);
    } else {
      setEvents((data as ClinicEventRow[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId]);

  async function onAddEvent() {
    if (!animalId) return;

    const cleanDescription = description.trim();

    setSaving(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      setSaving(false);
      setError("Devi essere autenticato per modificare la cartella clinica.");
      return;
    }

    const eventDate = fromDateTimeLocalValue(dateLocal).toISOString();

    // ✅ categoria unica: il titolo coincide con la label del tipo
    const title = typeLabel(type);

    const payload = {
      animal_id: animalId,
      event_date: eventDate,
      type,
      title,
      description: cleanDescription || null,
      visibility: "owner" as const,
      created_by: sessionData.session.user.id,
      source: "owner" as const, // per ora owner; professionista lo metteremo via API
      verified_at: null,
      verified_by: null,
    };

    const { error: insErr } = await supabase.from("animal_clinic_events").insert(payload);

    if (insErr) {
      setSaving(false);
      setError(insErr.message);
      return;
    }

    setDescription("");
    setType("note");
    setDateLocal(toDateTimeLocalValue(new Date()));

    await loadEvents();
    setSaving(false);
  }

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
        {/* Add event */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Nuovo evento</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Inserisci un evento (anche storico). La descrizione è facoltativa.
              </p>
            </div>

            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-500">
              Owner-only
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700">Categoria</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                value={type}
                onChange={(e) => setType(e.target.value as ClinicEventType)}
              >
                <option value="note">Nota</option>
                <option value="visit">Visita</option>
                <option value="vaccine">Vaccinazione</option>
                <option value="exam">Esame</option>
                <option value="therapy">Terapia</option>
                <option value="emergency">Emergenza</option>
                <option value="document">Documento</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700">Data e ora</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                value={dateLocal}
                onChange={(e) => setDateLocal(e.target.value)}
              />
              <p className="mt-1 text-xs text-zinc-500">
                Precompilata con l’orario attuale. Modificabile per caricare storico.
              </p>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-zinc-700">Descrizione (facoltativa)</label>
              <textarea
                className="mt-1 min-h-[96px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="Dettagli utili (farmaco, dosaggio, note cliniche)…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAddEvent}
              disabled={saving || !animalId}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
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
            Prossimi step: validazione professionista + allegati documenti + accesso emergenza.
          </p>
        </section>

        {/* Timeline */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Timeline</h2>
          <p className="mt-1 text-sm text-zinc-600">Eventi in ordine cronologico (più recenti in alto).</p>

          {loading ? (
            <div className="mt-4 text-sm text-zinc-600">Caricamento...</div>
          ) : events.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
              Nessun evento ancora. Aggiungi il primo evento per iniziare la timeline.
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {events.map((ev) => {
                const isVerified = ev.source === "professional" || !!ev.verified_at;
                return (
                  <div key={ev.id} className="rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-zinc-500">{formatDateIT(ev.event_date)}</div>

                        {/* Categoria unica (niente duplicazioni) */}
                        <div className="mt-1 truncate text-sm font-semibold text-zinc-900">
                          {typeLabel(ev.type)}
                        </div>

                        {ev.description ? (
                          <p className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">{ev.description}</p>
                        ) : null}
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
                          {ev.visibility}
                        </span>

                        {isVerified ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            ✓ Verificato professionista
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
    </PageShell>
  );
}