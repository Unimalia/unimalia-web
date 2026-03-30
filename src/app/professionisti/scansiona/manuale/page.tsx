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

  const [name, setName] = React.useState("");
  const [species, setSpecies] = React.useState("Cane");
  const [breed, setBreed] = React.useState("");
  const [color, setColor] = React.useState("");
  const [size, setSize] = React.useState("");
  const [sex, setSex] = React.useState("");
  const [sterilized, setSterilized] = React.useState<"" | "yes" | "no">("");
  const [birthDate, setBirthDate] = React.useState("");
  const [chipNumber, setChipNumber] = React.useState(chipFromQuery);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Inserisci un nome animale valido.");
      return;
    }

    if (species.trim().length < 2) {
      setError("Seleziona una specie.");
      return;
    }

    const normalizedChip = digitsOnly(chipNumber);

    if (normalizedChip && normalizedChip.length !== 15) {
      setError("Microchip non valido: servono 15 cifre.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/professionisti/animal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          species: species.trim(),
          breed: breed.trim() || null,
          color: color.trim() || null,
          size: size.trim() || null,
          sex: sex || null,
          sterilized:
            sterilized === "yes" ? true : sterilized === "no" ? false : null,
          birth_date: birthDate || null,
          microchip: normalizedChip || null,
        }),
      });

      const json: {
        error?: string;
        details?: string;
        hint?: string;
        animal?: { id?: string };
      } = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          json.error ||
          json.details ||
          json.hint ||
          `Errore creazione animale (HTTP ${res.status})`;

        setError(message);
        setSaving(false);
        return;
      }

      const animalId = json.animal?.id;
      if (!animalId) {
        setError("Animale creato ma ID non ricevuto.");
        setSaving(false);
        return;
      }

      router.replace(`/professionisti/animali/${animalId}`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Errore inatteso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-4">
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

      <p className="mt-3 text-sm text-zinc-700">
        Crea un animale anche senza proprietario collegato. Il proprietario si aggancerà in un
        secondo momento.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border bg-white p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Nome animale *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Zara"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Specie *</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            >
              <option value="Cane">Cane</option>
              <option value="Gatto">Gatto</option>
              <option value="Coniglio">Coniglio</option>
              <option value="Altro">Altro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Razza</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="Es. Labrador"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Colore</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Es. Nero"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Taglia</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Es. Media"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Sesso</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
            >
              <option value="">Seleziona</option>
              <option value="M">Maschio</option>
              <option value="F">Femmina</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Sterilizzato</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
              value={sterilized}
              onChange={(e) => setSterilized(e.target.value as "" | "yes" | "no")}
            >
              <option value="">Non specificato</option>
              <option value="yes">Sì</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Data di nascita</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Microchip</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={chipNumber}
              onChange={(e) => setChipNumber(digitsOnly(e.target.value))}
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

              {chipNumber ? (
                <button
                  type="button"
                  onClick={() => setChipNumber("")}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  Pulisci microchip
                </button>
              ) : null}
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              Il microchip è facoltativo, ma se presente puoi inserirlo manualmente oppure
              scansionarlo.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-700">
          Alla creazione:
          <br />- l’animale nasce in modalità professionista
          <br />- il proprietario non è ancora collegato
          <br />- la cartella può iniziare subito
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Creazione..." : "Crea animale"}
        </button>
      </form>
    </main>
  );
}