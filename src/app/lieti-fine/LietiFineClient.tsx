"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type HappyEndingReport = {
  id: string;
  created_at: string;
  type: "lost";
  status: string;
  title: string | null;
  animal_name: string | null;
  species: string | null;
  region: string | null;
  province: string | null;
  location_text: string | null;
  event_date: string | null;
  description: string | null;
  photo_urls: string[] | null;
  lat: number | null;
  lng: number | null;
};

function safeDate(value: string | null | undefined) {
  if (!value) return "Data non disponibile";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Data non disponibile";
  return d.toLocaleDateString("it-IT");
}

function safeCardTitle(item: HappyEndingReport) {
  if (item.animal_name && item.species) return `${item.animal_name} – ${item.species}`;
  if (item.animal_name) return item.animal_name;
  if (item.species) return item.species;
  if (item.title) return item.title;
  return "Lieto fine";
}

export default function LietiFineClient() {
  const [items, setItems] = useState<HappyEndingReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [locationFilter, setLocationFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("reports_public")
        .select("*")
        .eq("type", "lost")
        .eq("status", "closed_found")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
        setItems([]);
      } else {
        setItems((data as HappyEndingReport[]) ?? []);
      }

      setLoading(false);
    }

    void load();
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
    const locationQ = locationFilter.trim().toLowerCase();
    const provinceQ = provinceFilter.trim().toLowerCase();

    return items.filter((i) => {
      const locationOk =
        !locationQ ||
        (i.location_text || "").toLowerCase().includes(locationQ) ||
        (i.region || "").toLowerCase().includes(locationQ) ||
        (i.province || "").toLowerCase().includes(locationQ);

      const provOk = !provinceQ || (i.province || "").toLowerCase() === provinceQ;

      return locationOk && provOk;
    });
  }, [items, locationFilter, provinceFilter]);

  function resetFilters() {
    setLocationFilter("");
    setProvinceFilter("");
  }

  if (loading) {
    return <p>Caricamento lieti fine…</p>;
  }

  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">Lieti Fine ❤️</h1>
      <p className="mt-3 text-zinc-700">
        Qui raccogliamo i casi risolti positivamente: animali tornati a casa,
        ritrovati o ricongiunti con la propria famiglia.
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-900">
              Zona / Comune / Luogo
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder="Es. Firenze"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
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
          Nessun lieto fine corrisponde ai filtri selezionati.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {filtered.map((item) => {
            const imgSrc =
              !imageErrors[item.id] &&
              Array.isArray(item.photo_urls) &&
              item.photo_urls.length > 0
                ? item.photo_urls[0]
                : "/placeholder-animal.jpg";

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="bg-zinc-100 p-3">
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <div className="relative h-48 w-full">
                      <Image
                        src={imgSrc}
                        alt={safeCardTitle(item)}
                        fill
                        className="object-contain"
                        unoptimized
                        onError={() =>
                          setImageErrors((prev) => ({ ...prev, [item.id]: true }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold">{safeCardTitle(item)}</h2>

                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Lieto fine
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-600">
                    {(item.location_text || "—")} {item.province ? `(${item.province})` : ""} –{" "}
                    {safeDate(item.event_date)}
                  </p>

                  {item.description ? (
                    <p className="mt-3 line-clamp-3 text-sm text-zinc-700">
                      {item.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/annuncio/${item.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      Apri annuncio
                    </Link>
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