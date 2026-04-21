"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  microchip: string | null;
  owner_id: string | null;
  owner_claim_status?: "none" | "pending" | "claimed" | null;
  unimalia_code?: string | null;
  created_by_role?: string | null;
};

function normalizeChip(raw: string | null) {
  return (raw || "").replace(/\s+/g, "").trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function CollegaProprietarioPage() {
  const params = useParams<{ id: string }>();
  const animalId = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteOk, setInviteOk] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!animalId) return;

      setLoading(true);
      setErr(null);

      try {
        const res = await fetch(
          `/api/professionisti/animal?animalId=${encodeURIComponent(animalId)}`,
          { cache: "no-store" }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (!alive) return;
          setErr(json?.error || "Impossibile caricare l’animale.");
          setAnimal(null);
          return;
        }

        if (!alive) return;
        setAnimal((json?.animal as Animal) ?? null);
      } catch {
        if (!alive) return;
        setErr("Errore di rete durante il caricamento.");
        setAnimal(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();

    return () => {
      alive = false;
    };
  }, [animalId]);

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!animal?.id) {
      setErr("Animale non disponibile.");
      return;
    }

    if (!email.trim()) {
      setErr("Inserisci l’email del proprietario.");
      return;
    }

    setSending(true);
    setErr(null);
    setInviteOk(false);

    try {
      const res = await fetch("/api/professionisti/invite-owner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animalId: animal.id,
          email: email.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          json?.error ||
          json?.message ||
          `Errore invio invito proprietario (HTTP ${res.status})`;

        setErr(message);
        return;
      }

      setInviteOk(true);
      setEmail("");
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Errore invio invito proprietario."));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Caricamento…</p>
        </div>
      </main>
    );
  }

  if (err && !animal) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Link
          href={`/professionisti/animali/${animalId}`}
          className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          ← Torna alla scheda animale
        </Link>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm text-sm text-red-700">
          {err}
        </div>
      </main>
    );
  }

  if (!animal) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Link
          href={`/professionisti/animali/${animalId}`}
          className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          ← Torna alla scheda animale
        </Link>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm text-sm text-red-700">
          Animale non disponibile.
        </div>
      </main>
    );
  }

  const alreadyLinked = !!animal.owner_id;
  const identityPath = `/identita/nuovo?animalId=${encodeURIComponent(animal.id)}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/professionisti/animali/${animal.id}`}
            className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            ← Torna alla scheda
          </Link>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
            Collega proprietario
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Usa lo stesso animale già creato dalla clinica, senza duplicare la scheda.
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
            Scheda animale
          </span>

          {alreadyLinked ? (
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Proprietario collegato
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Proprietario non collegato
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-zinc-500">Animale</div>
            <div className="mt-1 font-semibold text-zinc-900">{animal.name}</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-zinc-500">Specie</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {animal.species}
              {animal.breed ? ` • ${animal.breed}` : ""}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-zinc-500">Microchip</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {animal.microchip ? normalizeChip(animal.microchip) : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-zinc-500">Codice UNIMALIA</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {animal.unimalia_code || "—"}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Invio invito proprietario</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            In questa fase puoi inviare al proprietario un’email per collegare lo stesso animale al suo account.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          Nessuna duplicazione: il proprietario si collegherà alla stessa scheda animale già esistente.
        </div>

        <form onSubmit={handleInviteSubmit} className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-900">
              Email proprietario
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.it"
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
            >
              {sending ? "Invio..." : "Invia invito proprietario"}
            </button>

            <Link
              href={identityPath}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Apri flusso identità owner
            </Link>
          </div>
        </form>

        {inviteOk ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Invito inviato correttamente.
          </div>
        ) : null}

        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {err}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Dati rapidi da copiare</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Puoi copiare ID animale o link diretto al flusso identità.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => copyValue("ID animale", animal.id)}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left hover:bg-zinc-50"
          >
            <div className="text-sm font-semibold text-zinc-900">Copia ID animale</div>
            <div className="mt-2 break-all font-mono text-xs text-zinc-500">{animal.id}</div>
          </button>

          <button
            type="button"
            onClick={() =>
              copyValue("Link identità", `${window.location.origin}${identityPath}`)
            }
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left hover:bg-zinc-50"
          >
            <div className="text-sm font-semibold text-zinc-900">Copia link identità</div>
            <div className="mt-2 break-all text-xs text-zinc-500">{identityPath}</div>
          </button>
        </div>

        {copied ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Copiato: {copied}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            href={identityPath}
            className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900"
          >
            Apri flusso identità owner
          </Link>

          <Link
            href={`/professionisti/animali/${animal.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Torna alla scheda
          </Link>
        </div>
      </section>
    </main>
  );
}