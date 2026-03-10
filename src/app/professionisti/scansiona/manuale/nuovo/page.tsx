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
    if (normalizedChip && normalizedChip.length !== 15 && normalizedChip.length !== 10) {
      setError("Microchip non valido: attese 15 cifre, opzionale 10.");
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
          breed: breed.trim(),
          color: color.trim(),
          size: size.trim(),
          birth_date: birthDate || null,
          chip_number: normalizedChip || null,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.error || "Errore creazione animale.");
        setSaving(false);
        return;
      }

      const animalId = json?.animal?.id;
      if (!animalId) {
        setError("Animale creato ma ID non ricevuto.");
        setSaving(false);
        return;
      }

      router.replace(`/professionisti/animali/${animalId}`);
    } catch (e: any) {
      setError(e?.message || "Errore inatteso.");
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
        Crea un animale anche senza proprietario collegato. Il proprietario si aggancerà in un secondo momento.
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
            <label className="block text-sm font-medium">Data di nascita</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Microchip</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={chipNumber}
              onChange={(e) => setChipNumber(digitsOnly(e.target.value))}
              placeholder="15 cifre"
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-700">
          Alla creazione:
          <br />
          - l’animale nasce in modalità professionista
          <br />
          - il proprietario non è ancora collegato
          <br />
          - la cartella può iniziare subito
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