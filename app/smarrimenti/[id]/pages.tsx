"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type LostEvent = {
  id: string;
  created_at: string;
  reporter_id: string;
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
  status: string;
};

export default function SmarrimentoDettaglioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [item, setItem] = useState<LostEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data, error } = await supabase
        .from("lost_events")
        .select(
          "id, created_at, reporter_id, species, animal_name, description, city, province, lost_date, primary_photo_url, lat, lng, contact_phone, contact_email, status"
        )
        .eq("id", id)
        .single();

      if (error) {
        setItem(null);
        setLoading(false);
        return;
      }

      setItem(data);
      setLoading(false);
    }

    load();
  }, [id]);

  function mapsUrl() {
    if (!item) return "#";
    if (item.lat != null && item.lng != null) {
      return `https://www.google.com/maps?q=${item.lat},${item.lng}`;
    }
    const q = `${item.city || ""} ${item.province || ""} Italia`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      q
    )}`;
  }

  async function copyLink() {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert("Link copiato ✅");
    } catch {
      alert("Non riesco a copiare il link. Copialo manualmente dalla barra.");
    }
  }

  function whatsappLink() {
    if (!currentUrl) return "https://wa.me/";
    const text = `Guarda questo annuncio su UNIMALIA: ${currentUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  if (loading) return <p>Caricamento…</p>;

  if (!item) {
    return (
      <main>
        <h1 className="text-2xl font-bold">Annuncio non trovato</h1>
        <p className="mt-2 text-zinc-700">
          Potrebbe essere stato rimosso o il link è errato.
        </p>
        <button
          onClick={() => router.push("/smarrimenti")}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Torna agli smarrimenti
        </button>
      </main>
    );
  }

  const isFound = item.status === "found";

  return (
    <main className="space-y-6">
      {isFound && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <p className="font-semibold">Ritrovato ✅</p>
          <p className="mt-1 text-sm">
            Questo annuncio è stato chiuso dal proprietario: l’animale è stato ritrovato.
          </p>
        </div>
      )}

      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <img
          src={
            (item.primary_photo_url || "/placeholder-animal.jpg") +
            `?v=${encodeURIComponent(item.created_at)}`
          }
          alt={item.animal_name || item.species}
          className="h-72 w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/placeholder-animal.jpg";
          }}
        />

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {item.species}
              {item.animal_name ? ` – ${item.animal_name}` : ""}
            </h1>

            {isFound && (
              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Ritrovato ✅
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-600">
            {(item.city || "—")} {item.province ? `(${item.province})` : ""} –{" "}
            {new Date(item.lost_date).toLocaleDateString()}
          </p>

          <p className="mt-4 text-zinc-800 leading-7">{item.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={mapsUrl()}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Apri su Google Maps
            </a>

            <button
              onClick={copyLink}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              disabled={!currentUrl}
            >
              Copia link
            </button>

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Condividi su WhatsApp
            </a>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Per contattare il proprietario usa “Contatta il proprietario” dalla pagina Smarrimenti.
          </p>
        </div>
      </div>
    </main>
  );
}
