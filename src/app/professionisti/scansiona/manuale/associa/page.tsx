"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type LookupAnimal = {
  id: string;
  name: string | null;
  species: string | null;
  chip_number: string | null;
  microchip: string | null;
  owner_id: string | null;
  owner_claim_status: string | null;
  unimalia_code: string | null;
  created_by_role: string | null;
};

function digitsOnly(v: string) {
  return String(v || "").replace(/\D+/g, "");
}

export default function AssociaAnimaleEsistentePage() {
  const router = useRouter();
  const params = useSearchParams();

  const chip = useMemo(() => digitsOnly(params.get("chip") ?? ""), [params]);

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<LookupAnimal | null>(null);
  const [hasDirectAccess, setHasDirectAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chipLooksValid = chip.length === 15 || chip.length === 10;

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!chipLooksValid) {
        setLoading(false);
        setError("Microchip non valido.");
        return;
      }

      setLoading(true);
      setError(null);
      setAnimal(null);
      setHasDirectAccess(false);

      try {
        const lookupRes = await fetch(
          `/api/professionisti/animals/find?q=${encodeURIComponent(chip)}`,
          {
            cache: "no-store",
            headers: {
              "x-unimalia-app": "professionisti",
            },
          }
        );

        const lookupJson = await lookupRes.json().catch(() => ({}));

        if (!lookupRes.ok) {
          if (!alive) return;
          setError(lookupJson?.error || "Errore lookup animale.");
          setLoading(false);
          return;
        }

        if (!lookupJson?.found || !lookupJson?.animal?.id) {
          if (!alive) return;
          setError("Nessun animale esistente trovato con questo microchip.");
          setLoading(false);
          return;
        }

        const foundAnimal = lookupJson.animal as LookupAnimal;

        if (!alive) return;
        setAnimal(foundAnimal);

        const accessRes = await fetch(
          `/api/professionisti/animal?animalId=${encodeURIComponent(foundAnimal.id)}`,
          {
            cache: "no-store",
            headers: {
              "x-unimalia-app": "professionisti",
            },
          }
        );

        if (!alive) return;

        if (accessRes.ok) {
          setHasDirectAccess(true);
        } else if (accessRes.status === 403) {
          setHasDirectAccess(false);
        } else if (accessRes.status === 404) {
          setError("Animale non trovato.");
          setAnimal(null);
        } else {
          const accessJson = await accessRes.json().catch(() => ({}));
          setError(accessJson?.error || "Errore verifica accesso animale.");
        }

        setLoading(false);
      } catch {
        if (!alive) return;
        setError("Errore di rete durante la ricerca animale.");
        setLoading(false);
      }
    }

    void run();

    return () => {
      alive = false;
    };
  }, [chip, chipLooksValid]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <div className="rounded-2xl border bg-white p-5 text-sm text-zinc-700">
          Caricamento…
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Animale esistente con microchip</h1>

        <button
          type="button"
          className="rounded-xl border px-3 py-2 text-sm"
          onClick={() => router.push("/professionisti/scansiona/manuale")}
        >
          ← Torna indietro
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="text-sm text-zinc-500">Microchip</div>
        <div className="mt-1 text-sm font-semibold text-zinc-900">
          {chip || "—"}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4">
          <div className="text-sm font-semibold text-amber-900">{error}</div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/professionisti/scansiona/manuale/nuovo?chip=${encodeURIComponent(chip)}`}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Crea nuovo animale
            </Link>

            <Link
              href="/professionisti/scansiona/manuale"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
            >
              Torna alla gestione manuale
            </Link>
          </div>
        </div>
      ) : null}

      {!error && animal ? (
        <div className="rounded-2xl border bg-white p-5 space-y-4">
          <div>
            <div className="text-sm text-zinc-500">Animale trovato</div>
            <div className="mt-1 text-lg font-semibold text-zinc-900">
              {animal.name || "Animale senza nome"}
            </div>
            <div className="mt-1 text-sm text-zinc-600">
              {[animal.species, animal.unimalia_code].filter(Boolean).join(" • ") || "—"}
            </div>
          </div>

          <div className="rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-700">
            {hasDirectAccess
              ? "Hai già accesso a questo animale: puoi aprire direttamente la scheda."
              : "L’animale esiste già, ma non hai accesso clinico attivo. Puoi avviare la richiesta di accesso."}
          </div>

          <div className="flex flex-wrap gap-2">
            {hasDirectAccess ? (
              <Link
                href={`/professionisti/animali/${encodeURIComponent(animal.id)}`}
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Apri scheda animale
              </Link>
            ) : (
              <Link
                href={`/professionisti/richieste-accesso?animalId=${encodeURIComponent(
                  animal.id
                )}&auto=1&chip=${encodeURIComponent(chip)}`}
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Richiedi accesso a questo animale
              </Link>
            )}

            <Link
              href="/professionisti/scansiona/manuale"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
            >
              Torna alla gestione manuale
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}