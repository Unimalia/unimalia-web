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
    <main className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Nuovo animale da professionista</h1>
        <button
          type="button"
          className="rounded-xl border px-3 py-2 text-sm"
          onClick={() => router.push("/professionisti/scansiona/manuale")}
        >
          Torna indietro
        </button>
      </div>

      <p className="text-sm text-zinc-700">
        Prima verifichiamo se esiste giÃ  una scheda coerente. Se non troviamo nulla,
        potrai creare una nuova scheda animale.
      </p>

      <form onSubmit={handleSearch} className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Email proprietario</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="es. proprietario@email.it"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Telefono proprietario</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="es. +39 333 1234567"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Microchip (opzionale)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
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
                className="rounded-xl border px-3 py-2 text-sm"
              >
                Scansiona microchip
              </button>

              {microchip ? (
                <button
                  type="button"
                  onClick={() => setMicrochip("")}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  Pulisci microchip
                </button>
              ) : null}
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              Il microchip Ã¨ facoltativo in questa fase. Se presente, viene usato come match forte.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-700">
          Il sistema controlla prima se esiste giÃ  una scheda compatibile.
          <br />- se trova una scheda coerente, puoi usarla subito
          <br />- se non trova nulla, puoi creare una nuova scheda
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Ricerca..." : "Cerca schede esistenti"}
        </button>
      </form>

      {result ? (
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          {result.found === false ? (
            <div className="space-y-3">
              <div className="rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                Nessuna scheda trovata. Puoi creare una nuova scheda animale.
              </div>

              <button
                type="button"
                onClick={goToCreateNew}
                className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Crea nuova scheda
              </button>
            </div>
          ) : null}

          {result.strong_match && result.animal ? (
            <div className="space-y-3">
              <div className="rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                <div className="font-medium text-zinc-900">Animale trovato tramite microchip</div>
                <div className="mt-2">
                  {result.animal.name ?? "Animale"} Â· {result.animal.species ?? "Specie non indicata"}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Microchip: {result.animal.microchip ?? "â€”"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => goToAnimal(result.animal.id)}
                  className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Apri scheda
                </button>

                <button
                  type="button"
                  onClick={goToCreateNew}
                  className="rounded-lg border px-5 py-3 text-sm font-semibold"
                >
                  Crea nuova comunque
                </button>
              </div>
            </div>
          ) : null}

          {Array.isArray(result.candidates) && result.candidates.length > 0 ? (
            <div className="space-y-3">
              <div className="rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                Abbiamo trovato una o piÃ¹ schede compatibili. Scegli quella corretta oppure crea
                una nuova scheda.
              </div>

              <div className="space-y-3">
                {result.candidates.map((animal: any) => (
                  <div key={animal.id} className="rounded-xl border p-4">
                    <div className="font-medium text-zinc-900">
                      {animal.name ?? "Animale"} Â· {animal.species ?? "Specie non indicata"}
                    </div>

                    <div className="mt-1 text-sm text-zinc-600">
                      Microchip: {animal.microchip ?? "â€”"}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      Stato owner: {animal.owner_claim_status ?? "none"}
                    </div>

                    <button
                      type="button"
                      onClick={() => goToAnimal(animal.id)}
                      className="mt-3 rounded-lg border px-4 py-2 text-sm font-semibold"
                    >
                      Usa questa scheda
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={goToCreateNew}
                className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Crea nuova scheda
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
