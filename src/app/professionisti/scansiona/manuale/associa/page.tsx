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
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
        <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="rounded-[2rem] border border-[#dde4ec] bg-white p-6 shadow-[0_24px_60px_rgba(42,56,86,0.08)] text-sm text-[#5f708a]">
            Caricamento…
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.08)]">
          <div className="border-b border-[#e3e9f0] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                  Associazione animale esistente
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#30486f]">
                  Animale esistente con microchip
                </h1>

                <p className="mt-4 text-sm leading-7 text-[#5f708a] sm:text-base">
                  Verifichiamo se il microchip è già collegato a una scheda esistente e se la tua
                  struttura ha già accesso diretto.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                onClick={() => router.push("/professionisti/scansiona/manuale")}
              >
                ← Torna indietro
              </button>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-4">
            <div className="rounded-[1.4rem] border border-[#e3e9f0] bg-white p-5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                Microchip
              </div>
              <div className="mt-2 text-sm font-semibold text-[#30486f]">
                {chip || "—"}
              </div>
            </div>

            {error ? (
              <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-5 space-y-4">
                <div className="text-sm font-semibold text-amber-900">{error}</div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/professionisti/scansiona/manuale/nuovo?chip=${encodeURIComponent(chip)}`}
                    className="rounded-full bg-[#30486f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                  >
                    Crea nuovo animale
                  </Link>

                  <Link
                    href="/professionisti/scansiona/manuale"
                    className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                  >
                    Torna alla gestione manuale
                  </Link>
                </div>
              </div>
            ) : null}

            {!error && animal ? (
              <div className="rounded-[1.4rem] border border-[#e3e9f0] bg-white p-5 space-y-4 shadow-sm">
                <div>
                  <div className="text-sm text-[#6f7d91]">Animale trovato</div>
                  <div className="mt-1 text-lg font-semibold text-[#30486f]">
                    {animal.name || "Animale senza nome"}
                  </div>
                  <div className="mt-1 text-sm text-[#5f708a]">
                    {[animal.species, animal.unimalia_code].filter(Boolean).join(" • ") || "—"}
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm text-[#5f708a]">
                  {hasDirectAccess
                    ? "Hai già accesso a questo animale: puoi aprire direttamente la scheda."
                    : "L’animale esiste già, ma non hai accesso clinico attivo. Puoi avviare la richiesta di accesso."}
                </div>

                <div className="flex flex-wrap gap-2">
                  {hasDirectAccess ? (
                    <Link
                      href={`/professionisti/animali/${encodeURIComponent(animal.id)}`}
                      className="rounded-full bg-[#30486f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                    >
                      Apri scheda animale
                    </Link>
                  ) : (
                    <Link
                      href={`/professionisti/richieste-accesso?animalId=${encodeURIComponent(
                        animal.id
                      )}&auto=1&chip=${encodeURIComponent(chip)}`}
                      className="rounded-full bg-[#30486f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                    >
                      Richiedi accesso a questo animale
                    </Link>
                  )}

                  <Link
                    href="/professionisti/scansiona/manuale"
                    className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                  >
                    Torna alla gestione manuale
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}