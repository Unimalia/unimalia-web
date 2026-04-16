"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import { PageShell } from "@/_components/ui/page-shell";
import { ButtonPrimary } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";

type LostReport = {
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
  contact_mode: "protected" | "phone_public" | null;
  public_phone?: string | null;
  lat: number | null;
  lng: number | null;
};

function safeDate(value: string | null | undefined) {
  if (!value) return "Data non disponibile";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Data non disponibile";
  return d.toLocaleDateString("it-IT");
}

function safeCardTitle(item: LostReport) {
  if (item.animal_name && item.species) return `${item.animal_name} – ${item.species}`;
  if (item.animal_name) return item.animal_name;
  if (item.species) return item.species;
  if (item.title) return item.title;
  return "Annuncio smarrimento";
}

export default function SmarrimentiPage() {
  const [items, setItems] = useState<LostReport[]>([]);
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
        .eq("type", "lost")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
        setItems([]);
      } else {
        setItems((data as LostReport[]) ?? []);
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

  function mapsUrl(item: LostReport) {
    if (item.lat != null && item.lng != null) {
      return `https://www.google.com/maps?q=${item.lat},${item.lng}`;
    }

    const q = `${item.location_text || ""} ${item.province || ""} ${item.region || ""} Italia`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  if (loading) {
    return (
      <PageShell
        title="Smarrimenti"
        subtitle="Segnalazioni attive di animali smarriti."
        backFallbackHref="/"
        boxed={false}
        actions={<ButtonPrimary href="/smarrimenti/nuovo">Pubblica smarrimento</ButtonPrimary>}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[380px] rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_14px_40px_rgba(42,56,86,0.06)]"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Smarrimenti"
      subtitle="Segnalazioni attive di animali smarriti."
      backFallbackHref="/"
      boxed={false}
      actions={<ButtonPrimary href="/smarrimenti/nuovo">Pubblica smarrimento</ButtonPrimary>}
    >
      <div className="mb-6">
        <Card>
          <div className="overflow-hidden rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_16px_40px_rgba(42,56,86,0.05)]">
            <div className="bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] px-6 py-8 text-white sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
                Ricerca annunci
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                Cerca per zona o provincia
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
                Filtra gli annunci attivi per trovare più rapidamente i casi nella tua area e aprire
                subito le segnalazioni più rilevanti.
              </p>
            </div>

            <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 sm:p-8">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold text-[#30486f]">
                    Zona / Comune / Luogo
                  </label>
                  <input
                    className="mt-2 w-full rounded-[18px] border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#30486f] outline-none transition placeholder:text-[#7a8799] focus:border-[#5f708a] focus:ring-4 focus:ring-[#30486f]/10"
                    placeholder="Es. Firenze, Coverciano..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#30486f]">Provincia</label>
                  <select
                    className="mt-2 w-full rounded-[18px] border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#30486f] outline-none transition focus:border-[#5f708a] focus:ring-4 focus:ring-[#30486f]/10"
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
                    className="w-full rounded-full border border-[#d7e0ea] bg-white px-4 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <p className="mt-5 text-xs text-[#5f708a]">
                Risultati:{" "}
                <span className="font-semibold text-[#30486f]">{filtered.length}</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-8 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
              Nessun risultato
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">
              Nessuno smarrimento corrisponde ai filtri selezionati.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
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
                className="overflow-hidden rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_16px_42px_rgba(42,56,86,0.06)]"
              >
                <div className="bg-[linear-gradient(180deg,#fff8f8_0%,#ffffff_100%)] p-3">
                  <div className="overflow-hidden rounded-[1.3rem] border border-[#f0dede] bg-white">
                    <div className="relative h-56 w-full">
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

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#30486f]">
                      {safeCardTitle(item)}
                    </h2>

                    <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                      Smarrito
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[#5f708a]">
                    {item.location_text || "Località non specificata"}{" "}
                    {item.province ? `(${item.province})` : ""} – {safeDate(item.event_date)}
                  </p>

                  {item.description ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#5f708a]">
                      {item.description}
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/annuncio/${item.id}`}
                      className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                    >
                      Apri annuncio
                    </Link>

                    <a
                      href={mapsUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,#2f69c7_0%,#2558ab_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,105,199,0.22)] transition hover:scale-[1.01]"
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