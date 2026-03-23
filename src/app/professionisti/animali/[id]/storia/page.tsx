"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { authHeaders } from "@/lib/client/authHeaders";
import {
  PROFESSIONAL_HISTORY_CATEGORIES,
  formatHistoryDateTime,
  historyCategoryLabels,
  historySourceScopeLabels,
  historyStatusLabels,
  historyVisibilityLabels,
  toLocalDatetimeInputValue,
  type AnimalHistoryEventRow,
  type ProfessionalHistoryCategory,
} from "@/lib/professionisti/history";

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  status: string;
};

type FormState = {
  sourceScope: "professional_service" | "professional_note";
  category: ProfessionalHistoryCategory;
  eventType: string;
  title: string;
  description: string;
  eventDate: string;
  nextActionDate: string;
  status: "planned" | "completed" | "cancelled";
  visibility: "shared" | "professionals";
};

function statusLabel(status: string) {
  switch (status) {
    case "lost":
      return "🔴 Smarrito";
    case "found":
      return "🔵 Ritrovato";
    case "home":
    case "safe":
    default:
      return "🟢 A casa";
  }
}

function createEmptyForm(): FormState {
  const now = new Date();

  return {
    sourceScope: "professional_service",
    category: "addestramento",
    eventType: "sessione",
    title: "",
    description: "",
    eventDate: toLocalDatetimeInputValue(now.toISOString()),
    nextActionDate: "",
    status: "completed",
    visibility: "shared",
  };
}

export default function ProAnimalHistoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<AnimalHistoryEventRow[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(createEmptyForm());

  const pageSubtitle = useMemo(() => {
    if (!animal) return "Timeline non clinica";
    return `${animal.name}${animal.breed ? ` · ${animal.breed}` : ""} · ${statusLabel(animal.status)}`;
  }, [animal]);

  async function loadAll() {
    if (!id) return;

    setLoading(true);
    setError(null);
    setEventsError(null);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      router.replace(
        "/professionisti/login?next=" +
          encodeURIComponent(`/professionisti/animali/${id}/storia`)
      );
      return;
    }

    try {
      const headers = {
        ...(await authHeaders()),
        "x-unimalia-app": "professionisti",
      };

      const [animalRes, historyRes] = await Promise.all([
        fetch(`/api/professionisti/animal?animalId=${encodeURIComponent(id)}`, {
          cache: "no-store",
          headers,
        }),
        fetch(`/api/professionisti/animal-history?animalId=${encodeURIComponent(id)}`, {
          cache: "no-store",
          headers,
        }),
      ]);

      const animalJson = await animalRes.json().catch(() => ({}));
      const historyJson = await historyRes.json().catch(() => ({}));

      if (!animalRes.ok) {
        setError(animalJson?.error || "Animale non trovato.");
        setAnimal(null);
        setEvents([]);
        setLoading(false);
        return;
      }

      setAnimal((animalJson?.animal ?? null) as Animal | null);

      if (!historyRes.ok) {
        setEvents([]);
        setEventsError(historyJson?.error || "Impossibile caricare la storia animale.");
        setLoading(false);
        return;
      }

      setEvents((historyJson?.events ?? []) as AnimalHistoryEventRow[]);
      setLoading(false);
    } catch {
      setError("Errore di rete durante il caricamento.");
      setAnimal(null);
      setEvents([]);
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setSaveError(null);
    setSaveOk(null);

    try {
      const res = await fetch("/api/professionisti/animal-history", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(await authHeaders()),
          "x-unimalia-app": "professionisti",
        },
        body: JSON.stringify({
          animalId: id,
          sourceScope: form.sourceScope,
          category: form.category,
          eventType: form.eventType,
          title: form.title,
          description: form.description || null,
          eventDate: form.eventDate,
          nextActionDate: form.nextActionDate || null,
          status: form.status,
          visibility: form.visibility,
          meta: {},
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSaveError(json?.error || "Impossibile salvare l’evento.");
        setSaving(false);
        return;
      }

      const created = json?.event as AnimalHistoryEventRow | undefined;

      if (created) {
        setEvents((prev) => [created, ...prev]);
      } else {
        await loadAll();
      }

      setForm(createEmptyForm());
      setSaveOk("Evento salvato correttamente.");
    } catch {
      setSaveError("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Caricamento storia animale…</p>
        </div>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <Link
          href="/professionisti/animali"
          className="inline-flex items-center text-sm font-semibold text-zinc-700 hover:text-zinc-900"
        >
          ← Torna agli animali
        </Link>

        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-zinc-900">Storia animale</div>
          <div className="mt-2 text-sm text-red-700">{error || "Animale non disponibile."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-500">Storia animale</div>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{animal.name}</h1>
            <p className="mt-2 text-sm text-zinc-600">{pageSubtitle}</p>
            <p className="mt-2 text-sm text-zinc-600">
              Timeline pratica condivisa. I promemoria clinici impostati dai veterinari possono
              comparire qui, ma la cartella sanitaria resta separata.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/professionisti/animali/${animal.id}`}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Torna alla scheda
            </Link>

            <span className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
              Timeline pratica
            </span>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Nuovo evento</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Registra servizi, attività o note non cliniche. I remind clinici arrivano qui
            automaticamente dal ramo veterinario quando verrà collegato.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Origine evento</label>
            <select
              value={form.sourceScope}
              onChange={(e) =>
                updateForm(
                  "sourceScope",
                  e.target.value as "professional_service" | "professional_note"
                )
              }
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            >
              <option value="professional_service">Servizio professionista</option>
              <option value="professional_note">Nota professionista</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Categoria</label>
            <select
              value={form.category}
              onChange={(e) =>
                updateForm("category", e.target.value as ProfessionalHistoryCategory)
              }
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            >
              {PROFESSIONAL_HISTORY_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {historyCategoryLabels[item]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Tipo evento</label>
            <input
              value={form.eventType}
              onChange={(e) => updateForm("eventType", e.target.value)}
              placeholder="es. sessione, bagno, pensione, sopralluogo"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Titolo</label>
            <input
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              placeholder="es. Sessione base al guinzaglio"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Data evento</label>
            <input
              type="datetime-local"
              value={form.eventDate}
              onChange={(e) => updateForm("eventDate", e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Prossima attività / promemoria
            </label>
            <input
              type="datetime-local"
              value={form.nextActionDate}
              onChange={(e) => updateForm("nextActionDate", e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Stato</label>
            <select
              value={form.status}
              onChange={(e) =>
                updateForm("status", e.target.value as "planned" | "completed" | "cancelled")
              }
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            >
              <option value="completed">Completato</option>
              <option value="planned">Programmato</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Visibilità</label>
            <select
              value={form.visibility}
              onChange={(e) =>
                updateForm("visibility", e.target.value as "shared" | "professionals")
              }
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            >
              <option value="shared">Condiviso con owner</option>
              <option value="professionals">Solo professionisti</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">Descrizione</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={5}
              placeholder="Note operative, attività svolte, osservazioni pratiche, prossimi passi..."
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            />
          </div>

          {(saveError || saveOk) && (
            <div className="md:col-span-2 space-y-3">
              {saveError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </div>
              ) : null}

              {saveOk ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {saveOk}
                </div>
              ) : null}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
            >
              {saving ? "Salvataggio..." : "Salva evento"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Timeline</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Cronologia pratica dell’animale, separata dalla cartella clinica.
          </p>
        </div>

        {eventsError ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {eventsError}
          </div>
        ) : null}

        {events.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600">
            Nessun evento registrato nella storia animale.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                        {historyCategoryLabels[event.category]}
                      </span>

                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                        {historySourceScopeLabels[event.source_scope]}
                      </span>

                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                        {historyStatusLabels[event.status]}
                      </span>

                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                        {historyVisibilityLabels[event.visibility]}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-semibold text-zinc-900">{event.title}</h3>

                    <p className="mt-1 text-sm text-zinc-600">
                      {event.event_type} · {formatHistoryDateTime(event.event_date)}
                    </p>

                    {event.description ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                        {event.description}
                      </p>
                    ) : null}

                    <div className="mt-3 text-xs text-zinc-500">
                      Inserito da: {event.author_name_snapshot || "Professionista"}
                    </div>
                  </div>

                  <div className="shrink-0 text-xs text-zinc-500">
                    {event.next_action_date ? (
                      <div>
                        Prossima attività:
                        <div className="mt-1 font-semibold text-zinc-700">
                          {formatHistoryDateTime(event.next_action_date)}
                        </div>
                      </div>
                    ) : (
                      <div>Nessun promemoria</div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}