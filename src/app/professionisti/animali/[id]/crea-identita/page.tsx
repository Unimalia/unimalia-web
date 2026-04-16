"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authHeaders } from "@/lib/client/authHeaders";

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  chip_number: string | null;
  owner_id: string | null;
  unimalia_code?: string | null;
  created_by_role?: string | null;
};

function normalizeChip(raw: string | null) {
  return (raw || "").replace(/\s+/g, "").trim();
}

export default function CreaIdentitaDaCartellaPage() {
  const params = useParams<{ id: string }>();
  const animalId = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!animalId) return;

      setLoading(true);
      setErr(null);

      try {
        const res = await fetch(`/api/professionisti/animal?animalId=${encodeURIComponent(animalId)}`, {
          cache: "no-store",
          headers: {
            ...(await authHeaders()),
          },
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (!alive) return;
          setErr(json?.error || "Impossibile caricare lâ€™animale.");
          setAnimal(null);
          setLoading(false);
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

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm text-sm text-zinc-600">
          Caricamentoâ€¦
        </div>
      </main>
    );
  }

  if (err || !animal) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-4">
        <Link
          href={`/professionisti/animali/${animalId}`}
          className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
        >
          â† Torna alla scheda animale
        </Link>

        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm text-sm text-red-700">
          {err || "Animale non disponibile."}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Crea identitÃ  dalla cartella professionista
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Questo animale Ã¨ giÃ  il record base UNIMALIA: non viene duplicato.
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
              {animal.species}{animal.breed ? ` â€¢ ${animal.breed}` : ""}
            </div>
          </div>

          <div>
            <div className="text-zinc-500">Microchip</div>
            <div className="font-semibold text-zinc-900">
              {animal.chip_number ? normalizeChip(animal.chip_number) : "â€”"}
            </div>
          </div>

          <div>
            <div className="text-zinc-500">Codice UNIMALIA</div>
            <div className="font-mono font-semibold text-zinc-900">
              {animal.unimalia_code || "Non disponibile"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">Stato attuale</h2>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          In questa versione:
          <br />
          - lâ€™identitÃ  non crea un nuovo animale
          <br />
          - usa la scheda animale giÃ  nata dal flusso professionista
          <br />
          - il passaggio successivo Ã¨ collegare il proprietario a questo stesso record
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/professionisti/animali/${animal.id}/collega-proprietario`}
            className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
          >
            Vai a collega proprietario
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