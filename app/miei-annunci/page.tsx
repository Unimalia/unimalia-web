"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type MyLostEvent = {
  id: string;
  created_at: string;
  reporter_id: string;

  animal_id: string | null;

  species: string;
  animal_name: string | null;
  city: string;
  province: string;
  lost_date: string;
  primary_photo_url: string;

  status: "active" | "found";

  animals?: { name: string; species: string }[] | null;
};

function badge(status: "active" | "found") {
  return status === "active" ? "🔴 Attivo" : "🔵 Chiuso";
}

export default function MieiAnnunciPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<MyLostEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function boot() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.getUser();
      const u = data.user;

      if (!u || error) {
        router.replace("/login");
        return;
      }

      if (!alive) return;
      setUserId(u.id);

      const { data: rows, error: e2 } = await supabase
        .from("lost_events")
        .select(
          `
          id, created_at, reporter_id,
          animal_id,
          species, animal_name, city, province, lost_date, primary_photo_url,
          status,
          animals:animal_id ( name, species )
        `
        )
        .eq("reporter_id", u.id)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (e2) {
        setError(e2.message);
        setItems([]);
      } else {
        setItems(((rows as unknown) as MyLostEvent[]) ?? []);
      }

      setLoading(false);
    }

    boot();
    return () => {
      alive = false;
    };
  }, [router]);

  async function markFound(item: MyLostEvent) {
    if (!userId) return;
    if (item.reporter_id !== userId) return;

    const ok = window.confirm("Confermi che l’animale è stato ritrovato e vuoi chiudere l’annuncio?");
    if (!ok) return;

    const { error: e1 } = await supabase
      .from("lost_events")
      .update({ status: "found" })
      .eq("id", item.id);

    if (e1) {
      alert(e1.message);
      return;
    }

    if (item.animal_id) {
      await supabase.from("animals").update({ status: "home" }).eq("id", item.animal_id);
    }

    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, status: "found" } : x))
    );
  }

  const activeCount = useMemo(() => items.filter((x) => x.status === "active").length, [items]);

  if (loading) {
    return (
      <main>
        <h1 className="text-3xl font-bold tracking-tight">I miei annunci</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  return (
    <main>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">I miei annunci</h1>
          <p className="mt-3 text-zinc-700">
            Annunci pubblicati da te. Attivi: <span className="font-medium">{activeCount}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/smarrimenti"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Vedi smarrimenti
          </Link>

          {/* Se esiste già la pagina di pubblicazione smarrimento, questo link andrà bene.
              Se non esiste ancora, lo sistemiamo nello step successivo. */}
          <Link
            href="/smarrimenti/nuovo"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Pubblica smarrimento
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          Errore: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">Non hai ancora pubblicato annunci.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {items.map((item) => {
            const linkedAnimal = item.animals?.[0] || null;
            const displaySpecies = linkedAnimal?.species || item.species || "Animale";
            const displayName = linkedAnimal?.name || item.animal_name || null;

            const imgSrc =
              (item.primary_photo_url || "/placeholder-animal.jpg") +
              `?v=${encodeURIComponent(item.created_at)}`;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <img
                  src={imgSrc}
                  alt={displayName ? `${displaySpecies} – ${displayName}` : displaySpecies}
                  className="h-44 w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder-animal.jpg";
                  }}
                />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {displaySpecies}
                        {displayName ? ` – ${displayName}` : ""}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-600">
                        {(item.city || "—")} {item.province ? `(${item.province})` : ""} –{" "}
                        {new Date(item.lost_date).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <span className="text-sm">{badge(item.status)}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/smarrimenti/${item.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      Apri annuncio
                    </Link>

                    {item.status === "active" && (
                      <button
                        type="button"
                        onClick={() => markFound(item)}
                        className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                        title="Segna come ritrovato"
                      >
                        Segna come ritrovato
                      </button>
                    )}
                  </div>

                  {item.animal_id ? (
                    <p className="mt-3 text-xs text-zinc-500">
                      Collegato al profilo animale ✅
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">
                      Smarrimento rapido (non collegato a profilo)
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
