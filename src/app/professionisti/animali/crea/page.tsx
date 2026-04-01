"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreaAnimalePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [microchip, setMicrochip] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill da ricerca
  useEffect(() => {
    const e = searchParams.get("email") || "";
    const p = searchParams.get("phone") || "";
    const m = searchParams.get("microchip") || "";

    setEmail(e);
    setPhone(p);
    setMicrochip(m);
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

    if (!email.trim()) {
      setError("Email proprietario obbligatoria");
      return;
    }

    if (!phone.trim()) {
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
          microchip,
          owner_email: email,
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

        <input
          placeholder="Specie (es. cane, gatto) *"
          className="w-full border rounded-lg px-3 py-2"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        />

        <input
          placeholder="Microchip (opzionale)"
          className="w-full border rounded-lg px-3 py-2"
          value={microchip}
          onChange={(e) => setMicrochip(e.target.value)}
        />

        <hr />

        <input
          placeholder="Email proprietario *"
          className="w-full border rounded-lg px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Telefono proprietario *"
          className="w-full border rounded-lg px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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