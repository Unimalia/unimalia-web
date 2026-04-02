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
      setError("Nome obbligatorio");
      return;
    }

    if (!species.trim()) {
      setError("Specie obbligatoria");
      return;
    }

    if (!pendingOwnerEmail.trim()) {
      setError("Email proprietario obbligatoria");
      return;
    }

    if (!pendingOwnerPhone.trim()) {
      setError("Telefono proprietario obbligatorio");
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
        throw new Error(data.error || "Errore creazione");
      }

      if (data.animal?.id) {
        router.push(`/professionisti/animali/${data.animal.id}`);
      } else {
        throw new Error("Risposta non valida");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Crea nuova scheda animale</h1>

      <div className="space-y-4">
        <input
          placeholder="Nome animale *"
          className="w-full border rounded-lg px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="w-full border rounded-lg px-3 py-2 bg-white"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        >
          {SPECIES_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <input
          placeholder="Microchip (opzionale)"
          className="w-full border rounded-lg px-3 py-2"
          value={chipNumber}
          onChange={(e) => setChipNumber(e.target.value)}
        />

        <hr />

        <input
          placeholder="Email proprietario *"
          className="w-full border rounded-lg px-3 py-2"
          value={pendingOwnerEmail}
          onChange={(e) => setPendingOwnerEmail(e.target.value)}
        />

        <input
          placeholder="Telefono proprietario *"
          className="w-full border rounded-lg px-3 py-2"
          value={pendingOwnerPhone}
          onChange={(e) => setPendingOwnerPhone(e.target.value)}
        />

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg"
        >
          {loading ? "Creazione..." : "Crea scheda animale"}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}
    </main>
  );
}