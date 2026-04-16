"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
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
      <main className="max-w-3xl mx-auto p-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm text-sm text-zinc-600">
          Caricamento…
        </div>
      </main>
    );
  }

  if (err && !animal) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-4">
        <Link
          href={`/professionisti/animali/${animalId}`}
          className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
        >
          ← Torna alla scheda animale
        </Link>

        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm text-sm text-red-700">
          {err}
        </div>
      </main>
    );
  }

  if (!animal) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-4">
        <Link
          href={`/professionisti/animali/${animalId}`}
          className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
        >
          ← Torna alla scheda animale
        </Link>

        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm text-sm text-red-700">
          Animale non disponibile.
        </div>
      </main>
    );
  }

  const alreadyLinked = !!animal.owner_id;
  const identityPath = `/identita/nuovo?animalId=${encodeURIComponent(animal.id)}`;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Collega proprietario</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Usa lo stesso animale già creato dalla clinica, senza duplicare la scheda.
          </p>
        </div>

        <Link
          href={`/professionisti/animali/${animal.id}`}
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          Torna alla scheda
        </Link>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <div className="text-zinc-500">Animale</div>
            <div className="font-semibold text-zinc-900">{animal.name}</div>
          </div>

          <div>
            <div className="text-zinc-500">Specie</div>
            <div className="font-semibold text-zinc-900">
              {animal.species}
              {animal.breed ? ` • ${animal.breed}` : ""}
            </div>
          </div>

          <div>
            <div className="text-zinc-500">Microchip</div>
            <div className="font-semibold text-zinc-900">
              {animal.microchip ? normalizeChip(animal.microchip) : "—"}
            </div>
          </div>

          <div>
            <div className="text-zinc-500">Stato proprietario</div>
            <div className="font-semibold text-zinc-900">
              {alreadyLinked ? "Proprietario collegato" : "Proprietario non collegato"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">Passaggio operativo</h2>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          In questa fase puoi inviare al proprietario un’email per collegare lo stesso animale al suo account.
        </div>

        <form onSubmit={handleInviteSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800">
              Email proprietario
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.it"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
          >
            {sending ? "Invio..." : "Invia invito proprietario"}
          </button>
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

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => copyValue("ID animale", animal.id)}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Copia ID animale
            <div className="mt-1 font-mono text-xs text-zinc-500 break-all">{animal.id}</div>
          </button>

          <button
            type="button"
            onClick={() =>
              copyValue("Link identità", `${window.location.origin}${identityPath}`)
            }
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Copia link identità
            <div className="mt-1 text-xs text-zinc-500 break-all">{identityPath}</div>
          </button>
        </div>

        {copied ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Copiato: {copied}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link
            href={identityPath}
            className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
          >
            Apri flusso identità owner
          </Link>

          <Link
            href={`/professionisti/animali/${animal.id}`}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Torna alla scheda
          </Link>
        </div>
      </div>
    </main>
  );
}