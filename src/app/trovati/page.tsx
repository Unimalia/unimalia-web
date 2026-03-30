"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import { PageShell } from "@/_components/ui/page-shell";
import { ButtonPrimary } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";

type PublicFoundReport = {
  id: string;
  created_at: string;
  type: "found" | "sighted";
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

function safeCardTitle(item: PublicFoundReport) {
  if (item.animal_name && item.species) return `${item.species} – ${item.animal_name}`;
  if (item.species) return item.species;
  if (item.animal_name) return item.animal_name;
  if (item.title) return item.title;
  return item.type === "found" ? "Animale trovato" : "Animale avvistato";
}

export default function TrovatiPage() {
  const [items, setItems] = useState<PublicFoundReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [locationFilter, setLocationFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("reports_public")
        .select("*")
        .in("type", ["found", "sighted"])
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
        setItems([]);
      } else {
        setItems((data as PublicFoundReport[]) ?? []);
      }

      setLoading(false);
    }

    void load();
  }, []);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const p = (item.province || "").trim();
      if (p) set.add(p);
    }
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const locationQ = locationFilter.trim().toLowerCase();
    const provinceQ = provinceFilter.trim().toLowerCase();

    return items.filter((item) => {
      const locationOk =
        !locationQ ||
        (item.location_text || "").toLowerCase().includes(locationQ) ||
        (item.region || "").toLowerCase().includes(locationQ) ||
        (item.province || "").toLowerCase().includes(locationQ);

      const provinceOk = !provinceQ || (item.province || "").toLowerCase() === provinceQ;

      return locationOk && provinceOk;
    });
  }, [items, locationFilter, provinceFilter]);

  function resetFilters() {
    setLocationFilter("");
    setProvinceFilter("");
  }

  function mapsUrl(item: PublicFoundReport) {
    if (item.lat != null && item.lng != null) {
      return `https://www.google.com/maps?q=${item.lat},${item.lng}`;
    }

    const q = `${item.location_text || ""} ${item.province || ""} ${item.region || ""} Italia`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  if (loading) {
    return (
      <PageShell
        title="Trovati / Avvistati"
        subtitle="Segnalazioni pubbliche attive di animali trovati o avvistati."
        backFallbackHref="/"
        boxed
        actions={<ButtonPrimary href="/trovati/nuovo">Segnala trovato / avvistato</ButtonPrimary>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-2xl border border-zinc-200 bg-white shadow-sm"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Trovati / Avvistati"
      subtitle="Animali trovati o avvistati da cittadini nella zona."
      backFallbackHref="/"
      boxed={false}
      actions={<ButtonPrimary href="/trovati/nuovo">Segnala trovato / avvistato</ButtonPrimary>}
    >
      <Card>
        <div className="space-y-4">
          <p className="text-sm text-zinc-700">
            Cerca per zona o provincia per trovare le segnalazioni attive.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-zinc-900">
                Zona / Comune / Luogo
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                placeholder="Es. Firenze, Novoli..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900">
                Provincia
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
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
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Reset
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            Risultati: <span className="font-medium text-zinc-700">{filtered.length}</span>
          </p>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <Card>
            <p className="text-sm text-zinc-700">
              Nessuna segnalazione trovata con i filtri selezionati.
            </p>
          </Card>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
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

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {safeCardTitle(item)}
                    </h2>

                    <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                      {item.type === "found" ? "Trovato" : "Avvistato"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-600">
                    {item.location_text || "Località non specificata"}{" "}
                    {item.province ? `(${item.province})` : ""} – {safeDate(item.event_date)}
                  </p>

                  {item.description ? (
                    <p className="mt-3 line-clamp-3 text-sm text-zinc-700">
                      {item.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/annuncio/${item.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Apri annuncio
                    </Link>

                    <a
                      href={mapsUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    >
                      Apri su Google Maps
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}