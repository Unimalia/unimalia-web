"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuovoAnimalePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [chipNumber, setChipNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/professionisti/animal/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          phone,
          chip_number: chipNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore ricerca.");
      }

      setResult(data);
    } catch (e: any) {
      setError(e.message || "Errore imprevisto.");
    } finally {
      setLoading(false);
    }
  }

  function goToAnimal(id: string) {
    router.push(`/professionisti/animali/${id}`);
  }

  function createNew() {
    const params = new URLSearchParams();
    if (email) params.set("pending_owner_email", email);
    if (phone) params.set("pending_owner_phone", phone);
    if (chipNumber) params.set("chip_number", chipNumber);

    router.push(`/professionisti/animali/crea?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.08)]">
          <div className="border-b border-[#e3e9f0] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-8 sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
              Area professionisti
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl">
              Nuova scheda animale
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f708a] sm:text-base">
              Cerca prima eventuali schede già esistenti tramite email, telefono o microchip.
              Se non trovi nulla, puoi crearne una nuova partendo dai dati inseriti.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-[#f8fbff] p-5">
              <div className="grid gap-5">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
                    Email proprietario
                  </span>
                  <input
                    placeholder="email@esempio.it"
                    className="w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-[#30486f] shadow-sm outline-none transition focus:border-[#30486f] focus:ring-4 focus:ring-[#30486f]/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
                    Telefono proprietario
                  </span>
                  <input
                    placeholder="+39..."
                    className="w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-[#30486f] shadow-sm outline-none transition focus:border-[#30486f] focus:ring-4 focus:ring-[#30486f]/10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
                    Microchip
                  </span>
                  <input
                    placeholder="Opzionale"
                    className="w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-[#30486f] shadow-sm outline-none transition focus:border-[#30486f] focus:ring-4 focus:ring-[#30486f]/10"
                    value={chipNumber}
                    onChange={(e) => setChipNumber(e.target.value)}
                  />
                </label>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
                  >
                    {loading ? "Ricerca..." : "Cerca schede esistenti"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/professionisti/animali")}
                    className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {result ? (
              <div className="mt-6 space-y-4">
                {result.found === false ? (
                  <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-[#30486f]">Nessuna scheda trovata</h2>
                    <p className="mt-2 text-sm leading-7 text-[#5f708a]">
                      Non risultano animali compatibili con i dati inseriti. Puoi procedere con la
                      creazione di una nuova scheda.
                    </p>
                    <button
                      onClick={createNew}
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                    >
                      Crea nuova scheda
                    </button>
                  </div>
                ) : null}

                {result.strong_match ? (
                  <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                    <div className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                      Match forte
                    </div>

                    <h2 className="mt-3 text-lg font-semibold text-emerald-900">
                      Animale trovato tramite microchip
                    </h2>

                    <p className="mt-2 text-sm text-emerald-800">
                      {result.animal.name} • {result.animal.species}
                    </p>

                    <button
                      onClick={() => goToAnimal(result.animal.id)}
                      className="mt-4 inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Apri scheda
                    </button>
                  </div>
                ) : null}

                {result.candidates ? (
                  <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-[#30486f]">Schede compatibili trovate</h2>
                    <p className="mt-2 text-sm leading-7 text-[#5f708a]">
                      Controlla le schede proposte prima di creare un nuovo animale.
                    </p>

                    <div className="mt-4 space-y-3">
                      {result.candidates.map((animal: any) => (
                        <div
                          key={animal.id}
                          className="rounded-[1rem] border border-[#e3e9f0] bg-[#f8fbff] p-4"
                        >
                          <p className="text-sm font-semibold text-[#30486f]">
                            {animal.name} • {animal.species}
                          </p>

                          <p className="mt-1 text-sm text-[#5f708a]">
                            Microchip: {animal.chip_number || "—"}
                          </p>

                          <button
                            onClick={() => goToAnimal(animal.id)}
                            className="mt-3 inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                          >
                            Usa questa scheda
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <button
                        onClick={createNew}
                        className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                      >
                        Nessuna corrisponde, crea nuova scheda
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}