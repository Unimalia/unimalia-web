"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AnimalPublic = {
  animal_id: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
};

export default function AnimalPublicPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<AnimalPublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.rpc("get_animal_public", { p_token: token });
        if (error) throw error;

        const row = (data?.[0] as AnimalPublic) ?? null;

        if (!alive) return;

        if (!row) {
          setItem(null);
          setError("Codice non valido o non più attivo.");
        } else {
          setItem(row);
        }
      } catch {
        setError("Errore nel caricamento della scheda.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (token) load();

    return () => {
      alive = false;
    };
  }, [token]);

  if (loading) {
    return (
      <main>
        <p className="text-sm text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  if (!item || error) {
    return (
      <main>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          ← Home
        </button>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">{error ?? "Scheda non disponibile."}</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
      <p className="mt-2 text-zinc-700">
        {item.species}
        {item.breed ? ` • ${item.breed}` : ""}
        {item.color ? ` • ${item.color}` : ""}
      </p>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">
          Questa è una scheda “rapida” di identificazione UNIMALIA.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/smarrimenti"
            className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Vedi smarrimenti
          </a>

          <a
            href="/smarrimento"
            className="rounded-lg border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Pubblica smarrimento
          </a>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Nota: UNIMALIA non sostituisce documenti ufficiali.
        </p>
      </div>
    </main>
  );
}
