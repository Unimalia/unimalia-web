"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type FoundEvent = {
  id: string;
  created_at: string;
  species: string;
  animal_name: string | null;
  description: string;
  city: string;
  province: string;
  event_date: string;
  primary_photo_url: string | null;
  lat: number | null;
  lng: number | null;
  type: "found" | "sighted";
};

export default function TrovatiPage() {
  const [items, setItems] = useState<FoundEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [cityFilter, setCityFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .in("type", ["found", "sighted"])
        .order("created_at", { ascending: false });

      if (!error && data) setItems(data);

      setLoading(false);
    }

    load();
  }, []);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      const p = (i.province || "").trim();
      if (p) set.add(p);
    }
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const c = cityFilter.trim().toLowerCase();
    const p = provinceFilter.trim().toLowerCase();

    return items.filter((i) => {
      const cityOk = !c || (i.city ?? "").toLowerCase().includes(c);
      const provOk = !p || (i.province ?? "").toLowerCase() === p;
      return cityOk && provOk;
    });
  }, [items, cityFilter, provinceFilter]);

  if (loading) return <p>Caricamento segnalazioni…</p>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Trovati / Avvistati
          </h1>

          <p className="mt-2 text-zinc-600">
            Animali trovati o avvistati da cittadini nella zona.
          </p>
        </div>

        <Link
          href="/trovati/nuovo"
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Segnala animale trovato
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <input
          placeholder="Città"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-lg border px-3 py-2"
        />

        <select
          value={provinceFilter}
          onChange={(e) => setProvinceFilter(e.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="">Tutte le province</option>
          {provinces.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        <button
          onClick={() => {
            setCityFilter("");
            setProvinceFilter("");
          }}
          className="rounded-lg border px-3 py-2"
        >
          Reset
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-zinc-600">
          Nessuna segnalazione trovata.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">

          {filtered.map((item) => {

            const img =
              item.primary_photo_url || "/placeholder-animal.jpg";

            return (
              <Link
                key={item.id}
                href={`/trovati/${item.id}`}
                className="rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition"
              >

                <img
                  src={img}
                  alt={item.species}
                  className="h-48 w-full object-cover"
                />

                <div className="p-4">

                  <div className="flex justify-between items-start">

                    <h2 className="font-semibold text-lg">
                      {item.species}
                      {item.animal_name ? ` – ${item.animal_name}` : ""}
                    </h2>

                    <span className="text-xs bg-zinc-100 px-2 py-1 rounded">
                      {item.type === "found" ? "Trovato" : "Avvistato"}
                    </span>

                  </div>

                  <p className="text-sm text-zinc-600 mt-1">
                    {item.city} {item.province ? `(${item.province})` : ""}
                  </p>

                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(item.event_date).toLocaleDateString("it-IT")}
                  </p>

                  <p className="text-sm text-zinc-700 mt-3">
                    {item.description}
                  </p>

                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}