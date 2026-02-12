"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AnimalRow = {
  id: string;
  name: string;
  species: string;
  status: string;
  created_at: string;
};

function statusLabel(status: string) {
  switch (status) {
    case "lost":
      return "🔴 Smarrito";
    case "found":
      return "🔵 Ritrovato";
    case "home":
    case "safe":
    default:
      return "🟢 A casa";
  }
}

export default function IdentitaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        router.replace("/login");
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from("animals")
        .select("id,name,species,status,created_at")
        .eq("owner_id", authData.user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (fetchErr) {
        setError(fetchErr.message);
        setAnimals([]);
      } else {
        setAnimals((data as AnimalRow[]) || []);
      }

      setLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Identità animale</h1>
          <p className="mt-3 max-w-2xl text-zinc-700">
            Qui trovi i profili digitali dei tuoi animali. Smarrimenti sempre gratuiti.
          </p>
        </div>

        <Link
          href="/identita/nuovo"
          className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-white hover:bg-zinc-800"
        >
          + Crea profilo animale
        </Link>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-700">Caricamento…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
            Errore nel caricamento: {error}
          </div>
        ) : animals.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-700">
              Nessun profilo creato. Crea il primo profilo del tuo animale.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {animals.map((a) => (
              <Link
                key={a.id}
                href={`/identita/${a.id}`}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{a.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">{a.species}</p>
                  </div>
                  <span className="text-sm">{statusLabel(a.status)}</span>
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  Creato il {new Date(a.created_at).toLocaleDateString("it-IT")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
