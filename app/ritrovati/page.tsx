"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type LostEvent = {
  id: string;
  created_at: string;
  species: string;
  animal_name: string | null;
  description: string;
  city: string;
  province: string;
  lost_date: string;
  primary_photo_url: string;
  lat: number | null;
  lng: number | null;
  status: string;
};

export default function RitrovatiPage() {
  const [items, setItems] = useState<LostEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [cityFilter, setCityFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("lost_events")
        .select(
          "id, created_at, species, animal_name, description, city, province, lost_date, primary_photo_url, lat, lng, status"
        )
        .eq("status", "found")
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

  function resetFilters() {
    setCityFilter("");
    setProvinceFilter("");
  }

  if (loading) return <p>Caricamento ritrovati…</p>;

  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">Ritrovati ✅</h1>
      <p className="mt-3 text-zinc-700">
        Alcuni smarrimenti si sono risolti. Questo aiuta a capire che UNIMALIA funziona.
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-900">Città</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder="Es. Firenze"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900">Provincia</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
            >
              <option value="">Tutte</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Reset
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Risultati: <span className="font-medium text-zinc-700">{filtered.length}</span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-zinc-700">
          Nessun ritrovamento corrisponde ai filtri selezionati.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {filtered.map((item) => {
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
                  alt={item.animal_name || item.species}
                  className="h-48 w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/placeholder-animal.jpg";
                  }}
                />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold">
                      {item.species}
                      {item.animal_name ? ` – ${item.animal_name}` : ""}
                    </h2>

                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Ritrovato ✅
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-600">
                    {(item.city || "—")} {item.province ? `(${item.province})` : ""} –{" "}
                    {new Date(item.lost_date).toLocaleDateString()}
                  </p>

                  <p className="mt-3 text-sm text-zinc-700">{item.description}</p>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={`/smarrimenti/${item.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      Apri annuncio
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
