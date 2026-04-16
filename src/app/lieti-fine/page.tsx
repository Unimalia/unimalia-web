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
  if (item.animal_name && item.species) return `${item.animal_name} â€“ ${item.species}`;
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
    return (
      <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
        <div className="mx-auto max-w-[1260px] px-4 py-8 sm:py-10">
          <div className="rounded-[2.5rem] border border-[#dde4ec] bg-white p-8 shadow-[0_24px_60px_rgba(42,56,86,0.10)]">
            <div className="max-w-3xl">
              <div className="h-3 w-28 rounded-full bg-zinc-200" />
              <div className="mt-4 h-10 w-72 rounded-2xl bg-zinc-200" />
              <div className="mt-4 h-5 w-[28rem] max-w-full rounded-xl bg-zinc-200" />
            </div>

            <div className="mt-8 rounded-[2rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="h-16 rounded-2xl bg-zinc-100" />
                <div className="h-16 rounded-2xl bg-zinc-100" />
                <div className="h-16 rounded-2xl bg-zinc-100" />
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_14px_40px_rgba(42,56,86,0.06)]"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
      <div className="mx-auto max-w-[1260px] px-4 py-8 sm:py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.10)]">
          <div className="px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
              Casi risolti
            </p>

            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[#30486f] sm:text-5xl lg:text-6xl">
              Lieti Fine
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#5f708a] sm:text-lg">
              Qui raccogliamo i casi risolti positivamente: animali tornati a casa,
              ritrovati o ricongiunti con la propria famiglia.
            </p>

            <div className="mt-8 rounded-[2rem] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
                Ricerca lieti fine
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
                Cerca per zona o provincia
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                Filtra i casi chiusi positivamente per trovare rapidamente i ricongiungimenti
                avvenuti nella tua area.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900">
                    Zona / Comune / Luogo
                  </label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#2f69c7]"
                    placeholder="Es. Firenze"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900">Provincia</label>
                  <select
                    className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#2f69c7]"
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
                    className="w-full rounded-full border border-[#d7dfe9] bg-white px-4 py-3 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs text-[#55657d]">
                Risultati:{" "}
                <span className="font-semibold text-[#30486f]">{filtered.length}</span>
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="mt-8 rounded-[2rem] border border-[#e3e9f0] bg-white p-8 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
                  Nessun risultato
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">
                  Nessun lieto fine corrisponde ai filtri selezionati.
                </p>
              </div>
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
                      className="overflow-hidden rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_14px_40px_rgba(42,56,86,0.06)]"
                    >
                      <div className="bg-[linear-gradient(180deg,#f6fffa_0%,#ffffff_100%)] p-3">
                        <div className="overflow-hidden rounded-[1.3rem] border border-[#dcefe4] bg-white">
                          <div className="relative h-52 w-full">
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

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#30486f]">
                            {safeCardTitle(item)}
                          </h2>

                          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Lieto fine
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-[#5f708a]">
                          {(item.location_text || "LocalitÃ  non specificata")}{" "}
                          {item.province ? `(${item.province})` : ""} â€“ {safeDate(item.event_date)}
                        </p>

                        {item.description ? (
                          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#5f708a]">
                            {item.description}
                          </p>
                        ) : null}

                        <div className="mt-5 flex gap-2">
                          <Link
                            href={`/annuncio/${item.id}`}
                            className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
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
          </div>
        </section>
      </div>
    </main>
  );
}
