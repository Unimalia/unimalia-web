"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

function digitsOnly(v: string) {
  return String(v || "").replace(/\D+/g, "");
}

export default function NuovoAnimaleProfessionistaPage() {
  const router = useRouter();
  const params = useSearchParams();

  const chipFromQuery = digitsOnly(params.get("chip") ?? "");

  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [microchip, setMicrochip] = React.useState(chipFromQuery);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!email.trim() && !phone.trim() && !microchip.trim()) {
      setError("Inserisci almeno email, telefono o microchip.");
      return;
    }

    const normalizedChip = digitsOnly(microchip);

    if (normalizedChip && normalizedChip.length !== 15) {
      setError("Microchip non valido: servono 15 cifre.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/professionisti/animal/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          microchip: normalizedChip || null,
        }),
      });

      const json: {
        error?: string;
        found?: boolean;
        strong_match?: boolean;
        animal?: {
          id: string;
          name: string | null;
          species: string | null;
          microchip: string | null;
          owner_claim_status?: string | null;
        };
        candidates?: Array<{
          id: string;
          name: string | null;
          species: string | null;
          microchip: string | null;
          owner_claim_status?: string | null;
        }>;
      } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error || `Errore ricerca animale (HTTP ${res.status})`);
        setLoading(false);
        return;
      }

      setResult(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore inatteso.");
    } finally {
      setLoading(false);
    }
  }

  function goToAnimal(id: string) {
    router.push(`/professionisti/animali/${id}`);
  }

  function goToCreateNew() {
    const query = new URLSearchParams();

    if (email.trim()) query.set("email", email.trim());
    if (phone.trim()) query.set("phone", phone.trim());
    if (microchip.trim()) query.set("microchip", digitsOnly(microchip));

    router.push(`/professionisti/animali/crea?${query.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.08)]">
          <div className="border-b border-[#e3e9f0] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                  Nuova scheda professionista
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#30486f]">
                  Cerca prima di creare
                </h1>

                <p className="mt-4 text-sm leading-7 text-[#5f708a] sm:text-base">
                  Prima verifichiamo se esiste già una scheda coerente. Se non troviamo nulla,
                  potrai creare una nuova scheda animale senza generare duplicati inutili.
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

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <form onSubmit={handleSearch} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[#30486f]">
                    Email proprietario
                  </label>
                  <input
                    className="mt-1 w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#30486f]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="es. proprietario@email.it"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#30486f]">
                    Telefono proprietario
                  </label>
                  <input
                    className="mt-1 w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#30486f]"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="es. +39 333 1234567"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#30486f]">
                    Microchip (opzionale)
                  </label>
                  <input
                    className="mt-1 w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#30486f]"
                    value={microchip}
                    onChange={(e) => setMicrochip(digitsOnly(e.target.value))}
                    placeholder="15 cifre"
                    inputMode="numeric"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/professionisti/scansiona?returnTo=" +
                            encodeURIComponent("/professionisti/scansiona/manuale/nuovo")
                        )
                      }
                      className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                    >
                      Scansiona microchip
                    </button>

                    {microchip ? (
                      <button
                        type="button"
                        onClick={() => setMicrochip("")}
                        className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                      >
                        Pulisci microchip
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-2 text-xs leading-6 text-[#6f7d91]">
                    Il microchip è facoltativo in questa fase. Se presente, viene usato come match forte.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm leading-7 text-[#5f708a]">
                Il sistema controlla prima se esiste già una scheda compatibile.
                <br />- se trova una scheda coerente, puoi usarla subito
                <br />- se non trova nulla, puoi creare una nuova scheda
              </div>

              {error ? (
                <div className="rounded-[1.2rem] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
              >
                {loading ? "Ricerca..." : "Cerca schede esistenti"}
              </button>
            </form>

            {result ? (
              <section className="mt-6 rounded-[1.6rem] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                {result.found === false ? (
                  <div className="space-y-3">
                    <div className="rounded-[1.2rem] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm text-[#5f708a]">
                      Nessuna scheda trovata. Puoi creare una nuova scheda animale.
                    </div>

                    <button
                      type="button"
                      onClick={goToCreateNew}
                      className="rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                    >
                      Crea nuova scheda
                    </button>
                  </div>
                ) : null}

                {result.strong_match && result.animal ? (
                  <div className="space-y-3">
                    <div className="rounded-[1.2rem] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm text-[#5f708a]">
                      <div className="font-semibold text-[#30486f]">Animale trovato tramite microchip</div>
                      <div className="mt-2">
                        {result.animal.name ?? "Animale"} · {result.animal.species ?? "Specie non indicata"}
                      </div>
                      <div className="mt-1 text-xs text-[#6f7d91]">
                        Microchip: {result.animal.microchip ?? "—"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => goToAnimal(result.animal.id)}
                        className="rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                      >
                        Apri scheda
                      </button>

                      <button
                        type="button"
                        onClick={goToCreateNew}
                        className="rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                      >
                        Crea nuova comunque
                      </button>
                    </div>
                  </div>
                ) : null}

                {Array.isArray(result.candidates) && result.candidates.length > 0 ? (
                  <div className="space-y-3">
                    <div className="rounded-[1.2rem] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm text-[#5f708a]">
                      Abbiamo trovato una o più schede compatibili. Scegli quella corretta oppure crea
                      una nuova scheda.
                    </div>

                    <div className="space-y-3">
                      {result.candidates.map((animal: any) => (
                        <div
                          key={animal.id}
                          className="rounded-[1.2rem] border border-[#e3e9f0] bg-white p-4"
                        >
                          <div className="font-semibold text-[#30486f]">
                            {animal.name ?? "Animale"} · {animal.species ?? "Specie non indicata"}
                          </div>

                          <div className="mt-1 text-sm text-[#5f708a]">
                            Microchip: {animal.microchip ?? "—"}
                          </div>

                          <div className="mt-1 text-xs text-[#6f7d91]">
                            Stato owner: {animal.owner_claim_status ?? "none"}
                          </div>

                          <button
                            type="button"
                            onClick={() => goToAnimal(animal.id)}
                            className="mt-3 rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                          >
                            Usa questa scheda
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={goToCreateNew}
                      className="rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                    >
                      Crea nuova scheda
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}