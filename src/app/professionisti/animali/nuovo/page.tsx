"use client";

import { useState } from "react";

export default function NuovoAnimalePage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [microchip, setMicrochip] = useState("");
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
          microchip,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore ricerca");
      }

      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Nuova scheda animale</h1>

      <div className="space-y-4">
        <input
          placeholder="Email proprietario"
          className="w-full border rounded-lg px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Telefono proprietario"
          className="w-full border rounded-lg px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          placeholder="Microchip (opzionale)"
          className="w-full border rounded-lg px-3 py-2"
          value={microchip}
          onChange={(e) => setMicrochip(e.target.value)}
        />

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg"
        >
          {loading ? "Ricerca..." : "Cerca schede esistenti"}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4">
          {result.found === false && (
            <div className="p-4 border rounded-lg">
              <p>Nessuna scheda trovata</p>
              <button className="mt-2 text-blue-600 underline">
                Crea nuova scheda
              </button>
            </div>
          )}

          {result.strong_match && (
            <div className="p-4 border rounded-lg">
              <p className="font-semibold">Animale trovato (microchip)</p>
              <p>{result.animal.name} - {result.animal.species}</p>
              <button className="mt-2 text-blue-600 underline">
                Apri scheda
              </button>
            </div>
          )}

          {result.candidates && (
            <div className="space-y-2">
              {result.candidates.map((a: any) => (
                <div key={a.id} className="p-4 border rounded-lg">
                  <p className="font-semibold">
                    {a.name} - {a.species}
                  </p>
                  <p className="text-sm text-gray-500">
                    Microchip: {a.microchip || "—"}
                  </p>

                  <button className="mt-2 text-blue-600 underline">
                    Usa questa scheda
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}