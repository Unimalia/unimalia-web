"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SPECIES_OPTIONS = ["Cane", "Gatto", "Coniglio", "Uccello", "Rettile", "Roditore", "Altro"];

export default function CreaAnimalePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Cane");
  const [chipNumber, setChipNumber] = useState("");
  const [pendingOwnerEmail, setPendingOwnerEmail] = useState("");
  const [pendingOwnerPhone, setPendingOwnerPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = searchParams.get("pending_owner_email") || "";
    const phone = searchParams.get("pending_owner_phone") || "";
    const chipNumberParam = searchParams.get("chip_number") || "";

    setPendingOwnerEmail(email);
    setPendingOwnerPhone(phone);
    setChipNumber(chipNumberParam);
  }, [searchParams]);

  async function handleCreate() {
    setError(null);

    if (!name.trim()) {
      setError("Nome obbligatorio.");
      return;
    }

    if (!species.trim()) {
      setError("Specie obbligatoria.");
      return;
    }

    if (!pendingOwnerEmail.trim()) {
      setError("Email proprietario obbligatoria.");
      return;
    }

    if (!pendingOwnerPhone.trim()) {
      setError("Telefono proprietario obbligatorio.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/professionisti/animal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          species,
          chip_number: chipNumber,
          pending_owner_email: pendingOwnerEmail,
          pending_owner_phone: pendingOwnerPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore creazione.");
      }

      if (data.animal?.id) {
        router.push(`/professionisti/animali/${data.animal.id}`);
      } else {
        throw new Error("Risposta non valida.");
      }
    } catch (e: any) {
      setError(e.message || "Errore imprevisto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.08)]">
          <div className="border-b border-[#e3e9f0] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-8 sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
              Area professionisti
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl">
              Crea nuova scheda animale
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f708a] sm:text-base">
              Crea una nuova scheda partendo dai dati base dell’animale e dai riferimenti del
              proprietario da collegare in seguito.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-[#f8fbff] p-5">
              <div className="grid gap-5">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
                    Nome animale
                  </span>
                  <input
                    placeholder="Es. Leo"
                    className="w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-[#30486f] shadow-sm outline-none transition focus:border-[#30486f] focus:ring-4 focus:ring-[#30486f]/10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
                    Specie
                  </span>
                  <select
                    className="w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-[#30486f] shadow-sm outline-none transition focus:border-[#30486f] focus:ring-4 focus:ring-[#30486f]/10"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                  >
                    {SPECIES_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
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
                  <p className="mt-1.5 text-xs text-[#6f7d91]">
                    Può essere inserito subito oppure aggiunto successivamente.
                  </p>
                </label>

                <div className="h-px w-full bg-[#e3e9f0]" />

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
                    Email proprietario
                  </span>
                  <input
                    placeholder="email@esempio.it"
                    className="w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-[#30486f] shadow-sm outline-none transition focus:border-[#30486f] focus:ring-4 focus:ring-[#30486f]/10"
                    value={pendingOwnerEmail}
                    onChange={(e) => setPendingOwnerEmail(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
                    Telefono proprietario
                  </span>
                  <input
                    placeholder="+39..."
                    className="w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-[#30486f] shadow-sm outline-none transition focus:border-[#30486f] focus:ring-4 focus:ring-[#30486f]/10"
                    value={pendingOwnerPhone}
                    onChange={(e) => setPendingOwnerPhone(e.target.value)}
                  />
                </label>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
                  >
                    {loading ? "Creazione..." : "Crea scheda animale"}
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
          </div>
        </div>
      </section>
    </main>
  );
}