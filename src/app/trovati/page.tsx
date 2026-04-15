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
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_14px_40px_rgba(42,56,86,0.06)]"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Trovati / Avvistati"
      subtitle="Animali trovati o avvistati da cittadini sul territorio."
      backFallbackHref="/"
      boxed={false}
      actions={<ButtonPrimary href="/trovati/nuovo">Segnala trovato / avvistato</ButtonPrimary>}
    >
      <div className="mb-6">
        <Card>
          <div className="rounded-[2rem] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
              Ricerca segnalazioni
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
              Cerca per zona o provincia
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
              Filtra le segnalazioni attive per trovare più rapidamente casi compatibili nella tua area.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-zinc-900">
                  Zona / Comune / Luogo
                </label>
                <input
                  className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#2f69c7]"
                  placeholder="Es. Firenze, Novoli..."
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

            <p className="mt-4 text-xs text-[#6f7d91]">
              Risultati:{" "}
              <span className="font-semibold text-[#30486f]">{filtered.length}</span>
            </p>
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
              Nessuna segnalazione trovata con i filtri selezionati.
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
                className="overflow-hidden rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_14px_40px_rgba(42,56,86,0.06)]"
              >
                <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-3">
                  <div className="overflow-hidden rounded-[1.3rem] border border-[#e5ebf1] bg-white">
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

                    <span
                      className={[
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                        item.type === "found"
                          ? "border-sky-200 bg-sky-50 text-sky-700"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700",
                      ].join(" ")}
                    >
                      {item.type === "found" ? "Trovato" : "Avvistato"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[#5f708a]">
                    {item.location_text || "Località non specificata"}{" "}
                    {item.province ? `(${item.province})` : ""} – {safeDate(item.event_date)}
                  </p>

                  {item.description ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#5f708a]">
                      {item.description}
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/annuncio/${item.id}`}
                      className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
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