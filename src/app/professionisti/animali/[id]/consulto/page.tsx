"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authHeaders } from "@/lib/client/authHeaders";

type ComposeEvent = {
  id: string;
  event_date: string | null;
  type: string | null;
  title: string | null;
  description: string | null;
  visibility: string | null;
  status: string | null;
  priority: string | null;
  created_at: string;
};

type ComposeData = {
  animal: {
    id: string;
    name: string;
    species: string | null;
    breed: string | null;
    sex: string | null;
    microchip: string | null;
  };
  events: ComposeEvent[];
};

type Recipient = {
  id: string;
  display_name: string | null;
  city: string | null;
  province: string | null;
};

type Tag = {
  id: string;
  label: string;
  key: string;
};

function formatEventDate(value: string | null, fallbackCreatedAt: string) {
  const source = value || fallbackCreatedAt;
  const d = new Date(source);
  if (Number.isNaN(d.getTime())) return "Data non disponibile";
  return d.toLocaleString("it-IT");
}

export default function NewProfessionalConsultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [compose, setCompose] = useState<ComposeData | null>(null);

  const [q, setQ] = useState("");
  const [tagId, setTagId] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsByProfessional, setTagsByProfessional] = useState<Record<string, Tag[]>>({});
  const [receiverProfessionalId, setReceiverProfessionalId] = useState("");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [shareMode, setShareMode] = useState<"full_record" | "selected_events">("full_record");
  const [priority, setPriority] = useState<"normal" | "emergency">("normal");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  const animalId = String(params.id ?? "");

  const loadCompose = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/professionisti/consults?mode=compose&animalId=${animalId}`,
        {
          cache: "no-store",
          headers: {
            ...(await authHeaders()),
            "x-unimalia-app": "professionisti",
          },
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Errore caricamento dati animale");
      }

      const rawAnimal = json?.animal ?? {};
      const rawEvents = Array.isArray(json?.events) ? json.events : [];

      const safeCompose: ComposeData = {
        animal: {
          id: String(rawAnimal?.id ?? ""),
          name: String(rawAnimal?.name ?? ""),
          species: rawAnimal?.species ?? null,
          breed: rawAnimal?.breed ?? null,
          sex: rawAnimal?.sex ?? null,
          microchip: rawAnimal?.microchip ?? rawAnimal?.chip_number ?? null,
        },
        events: rawEvents as ComposeEvent[],
      };

      setCompose(safeCompose);
      setSubject(`Consulto clinico ${safeCompose.animal.name || ""}`.trim());
      setSelectedEventIds(rawEvents.map((event: ComposeEvent) => event.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  const searchRecipients = useCallback(async () => {
    try {
      const paramsSearch = new URLSearchParams();
      if (q.trim()) paramsSearch.set("q", q.trim());
      if (tagId) paramsSearch.set("tagId", tagId);

      const res = await fetch(
        `/api/professionisti/consults/recipients?${paramsSearch.toString()}`,
        {
          cache: "no-store",
          headers: {
            ...(await authHeaders()),
            "x-unimalia-app": "professionisti",
          },
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Errore ricerca professionisti");
      }

      setRecipients(Array.isArray(json?.professionals) ? (json.professionals as Recipient[]) : []);
      setTagsByProfessional(
        json?.tagsByProfessional && typeof json.tagsByProfessional === "object"
          ? (json.tagsByProfessional as Record<string, Tag[]>)
          : {}
      );
      setTags(Array.isArray(json?.tags) ? (json.tags as Tag[]) : []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore imprevisto");
    }
  }, [q, tagId]);

  useEffect(() => {
    void loadCompose();
  }, [loadCompose]);

  useEffect(() => {
    void searchRecipients();
  }, [searchRecipients]);

  const effectiveSelectedIds = useMemo(() => {
    if (!compose) return [];
    if (shareMode === "full_record") {
      return (compose.events ?? []).map((event: ComposeEvent) => event.id);
    }
    return selectedEventIds;
  }, [compose, shareMode, selectedEventIds]);

  function toggleEvent(id: string) {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit() {
    try {
      setSaving(true);

      const res = await fetch("/api/professionisti/consults", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
          "x-unimalia-app": "professionisti",
        },
        body: JSON.stringify({
          animalId,
          receiverProfessionalId,
          subject,
          message,
          shareMode,
          priority,
          selectedEventIds: effectiveSelectedIds,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Errore creazione consulto");
      }

      router.push(`/professionisti/richieste/${json.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Caricamento...</p>
        </div>
      </main>
    );
  }

  if (error || !compose) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error || "Dati non disponibili"}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
      >
        ← Indietro
      </button>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
            Consulto professionista
          </span>
          <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
            {compose.animal.name || "Animale"}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
          Nuovo consulto professionista
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
          Condividi la cartella clinica completa visibile oppure solo eventi selezionati.
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Animale</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-zinc-500">Nome</div>
            <div className="mt-1 font-semibold text-zinc-900">{compose.animal.name}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-zinc-500">Specie</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {compose.animal.species ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-zinc-500">Razza</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {compose.animal.breed ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-zinc-500">Sesso</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {compose.animal.sex ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:col-span-2">
            <div className="text-zinc-500">Microchip</div>
            <div className="mt-1 font-semibold text-zinc-900 break-all">
              {compose.animal.microchip ?? "—"}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Destinatario</h2>

          <div className="mt-5 grid gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ricerca libera..."
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />

            <select
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            >
              <option value="">Tutte le skill</option>
              {tags.map((tag: Tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void searchRecipients()}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Cerca professionisti
            </button>
          </div>

          <div className="mt-5 max-h-[560px] space-y-3 overflow-auto">
            {recipients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-600">
                Nessun professionista trovato.
              </div>
            ) : (
              recipients.map((pro: Recipient) => {
                const selected = receiverProfessionalId === pro.id;

                return (
                  <button
                    key={pro.id}
                    type="button"
                    onClick={() => setReceiverProfessionalId(pro.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-black bg-zinc-100"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-zinc-900">
                      {pro.display_name || "Professionista"}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      {[pro.city, pro.province].filter(Boolean).join(" · ") ||
                        "Località non disponibile"}
                    </div>

                    {tagsByProfessional[pro.id]?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tagsByProfessional[pro.id].map((tag: Tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700"
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Messaggio clinico</h2>

            <div className="mt-5 grid gap-4">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Oggetto"
                className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900"
              />

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                placeholder="Scrivi il referto o la richiesta di consulto..."
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Condivisione</h2>

            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer gap-3 rounded-2xl border border-zinc-200 p-4">
                <input
                  type="radio"
                  checked={shareMode === "full_record"}
                  onChange={() => setShareMode("full_record")}
                />
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    Condividi tutta la cartella visibile
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    Condivide tutti gli eventi clinici attualmente visibili.
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer gap-3 rounded-2xl border border-zinc-200 p-4">
                <input
                  type="radio"
                  checked={shareMode === "selected_events"}
                  onChange={() => setShareMode("selected_events")}
                />
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    Condividi solo eventi selezionati
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    Seleziona manualmente gli eventi clinici da inoltrare.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Priorità</h2>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "normal" | "emergency")}
              className="mt-5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            >
              <option value="normal">Normale</option>
              <option value="emergency">Emergenza</option>
            </select>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Eventi condivisi</h2>
              <p className="text-xs text-zinc-500">
                Selezionati: <span className="font-semibold text-zinc-800">{effectiveSelectedIds.length}</span>
              </p>
            </div>

            <div className="mt-5 max-h-[440px] space-y-3 overflow-auto">
              {(compose?.events ?? []).length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                  Nessun evento clinico disponibile da condividere.
                </div>
              ) : (
                (compose?.events ?? []).map((event: ComposeEvent) => {
                  const checked = effectiveSelectedIds.includes(event.id);

                  return (
                    <label
                      key={event.id}
                      className="flex cursor-pointer gap-3 rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={shareMode === "full_record"}
                        onChange={() => toggleEvent(event.id)}
                      />

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-zinc-900">
                          {event.title || "Evento clinico"}
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                          {formatEventDate(event.event_date, event.created_at)}
                        </div>

                        {event.description ? (
                          <div className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-700">
                            {event.description}
                          </div>
                        ) : null}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={
                saving ||
                !receiverProfessionalId ||
                !subject.trim() ||
                effectiveSelectedIds.length === 0
              }
              className="mt-6 w-full rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
            >
              {saving ? "Invio in corso..." : "Invia consulto"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}