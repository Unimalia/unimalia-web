"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import { PageShell } from "@/_components/ui/page-shell";
import { ButtonPrimary, ButtonSecondary } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";

type LostEvent = {
  id: string;
  created_at: string;
  reporter_id: string;
  animal_id: string | null;
  species: string;
  animal_name: string | null;
  description: string;
  city: string;
  province: string;
  lost_date: string;
  primary_photo_url: string;
  lat: number | null;
  lng: number | null;
  contact_phone: string | null;
  contact_email: string | null;
  animals?: { name: string; species: string }[] | null;
};

export default function SmarrimentiPage() {
  const router = useRouter();

  const [items, setItems] = useState<LostEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [cityFilter, setCityFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("lost_events")
        .select(
          `
          id, created_at, reporter_id,
          animal_id,
          species, animal_name, description, city, province, lost_date,
          primary_photo_url, lat, lng, contact_phone, contact_email,
          animals:animal_id ( name, species )
          `
        )
        .eq("status", "active")
        .order("lost_date", { ascending: false });

      if (error) {
        console.error(error.message);
        setItems([]);
      } else {
        setItems((data as unknown as LostEvent[]) ?? []);
      }

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

  function mapsUrl(item: LostEvent) {
    if (item.lat != null && item.lng != null) {
      return `https://www.google.com/maps?q=${item.lat},${item.lng}`;
    }

    const q = `${item.city || ""} ${item.province || ""} Italia`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  function detailUrl(item: LostEvent) {
    return `/smarrimenti/${item.id}`;
  }

  async function markFound(item: LostEvent) {
    if (!currentUserId || item.reporter_id !== currentUserId) return;

    const ok = window.confirm("Confermi che l’animale è stato ritrovato?");
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
      const { error: e2 } = await supabase
        .from("animals")
        .update({ status: "home" })
        .eq("id", item.animal_id);

      if (e2) {
        console.warn("Impossibile aggiornare stato animale:", e2.message);
      }
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
  }

  if (loading) {
    return (
      <PageShell
        title="Smarrimenti"
        subtitle="Segnalazioni attive di animali smarriti."
        backFallbackHref="/"
        boxed
        actions={
          <>
            <ButtonSecondary href="/smarrimenti/miei">I miei annunci</ButtonSecondary>
            <ButtonPrimary href="/smarrimenti/nuovo">Pubblica smarrimento</ButtonPrimary>
          </>
        }
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
      title="Smarrimenti"
      subtitle="Segnalazioni attive di animali smarriti. Se hai perso un animale, pubblica qui il tuo annuncio."
      backFallbackHref="/"
      boxed={false}
      actions={
        <>
          <ButtonSecondary href="/smarrimenti/miei">I miei annunci</ButtonSecondary>
          <ButtonPrimary href="/smarrimenti/nuovo">Pubblica smarrimento</ButtonPrimary>
        </>
      }
    >
      <Card>
        <div className="space-y-4">
          <p className="text-sm text-zinc-700">
            Cerca per città o provincia per trovare gli annunci attivi nella tua zona.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-zinc-900">
                Città
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                placeholder="Es. Firenze"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
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
              Nessuno smarrimento corrisponde ai filtri selezionati.
            </p>
          </Card>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {filtered.map((item) => {
            const imgSrc =
              (item.primary_photo_url || "/placeholder-animal.jpg") +
              `?v=${encodeURIComponent(item.created_at)}`;

            const isOwner = currentUserId && item.reporter_id === currentUserId;

            const linkedAnimal = item.animals?.[0] || null;
            const displaySpecies = linkedAnimal?.species || item.species || "Animale";
            const displayName = linkedAnimal?.name || item.animal_name || null;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <img
                  src={imgSrc}
                  alt={displayName ? `${displaySpecies} – ${displayName}` : displaySpecies}
                  className="h-48 w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder-animal.jpg";
                  }}
                />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {displaySpecies}
                      {displayName ? ` – ${displayName}` : ""}
                    </h2>

                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => markFound(item)}
                        className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        title="Segna come ritrovato"
                      >
                        Segna come ritrovato
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-zinc-600">
                    {(item.city || "—")} {item.province ? `(${item.province})` : ""} –{" "}
                    {new Date(item.lost_date).toLocaleDateString("it-IT")}
                  </p>

                  <p className="mt-3 text-sm text-zinc-700">{item.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={detailUrl(item)}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Apri annuncio
                    </a>

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