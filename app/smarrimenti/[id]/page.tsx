"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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

  status: "active" | "found";

  animals?: { name: string; species: string }[] | null;
};

export default function SmarrimentoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LostEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) return;

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("lost_events")
        .select(
          `
          id, created_at, reporter_id,
          animal_id,
          species, animal_name, description, city, province, lost_date,
          primary_photo_url, lat, lng, contact_phone, contact_email,
          status,
          animals:animal_id ( name, species )
        `
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        setItem(null);
        setError(error?.message || "Annuncio non trovato.");
      } else {
        setItem((data as unknown) as LostEvent);
      }

      setLoading(false);
    }

    load();
  }, [id]);

  const linkedAnimal = useMemo(() => item?.animals?.[0] || null, [item]);
  const displaySpecies = useMemo(
    () => linkedAnimal?.species || item?.species || "Animale",
    [linkedAnimal, item]
  );
  const displayName = useMemo(
    () => linkedAnimal?.name || item?.animal_name || null,
    [linkedAnimal, item]
  );

  function mapsUrl() {
    if (!item) return "#";
    if (item.lat != null && item.lng != null) {
      return `https://www.google.com/maps?q=${item.lat},${item.lng}`;
    }
    const q = `${item.city || ""} ${item.province || ""} Italia`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  async function copyLink() {
    if (!baseUrl || !item) return;
    const link = `${baseUrl}/smarrimenti/${item.id}`;
    try {
      await navigator.clipboard.writeText(link);
      alert("Link copiato ✅");
    } catch {
      alert("Non riesco a copiare il link. Copialo dalla barra del browser.");
    }
  }

  function whatsappLink() {
    if (!baseUrl || !item) return "https://wa.me/";
    const link = `${baseUrl}/smarrimenti/${item.id}`;
    const text = `🐾 ANIMALE SMARRITO\n${displaySpecies}${displayName ? " – " + displayName : ""}\n${item.city || ""} ${
      item.province ? "(" + item.province + ")" : ""
    }\nLink: ${link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  if (loading) {
    return (
      <main className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Annuncio smarrimento</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Annuncio smarrimento</h1>
        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error || "Annuncio non trovato."}
        </div>
        <div className="mt-6 flex gap-2">
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Torna alla Home
          </Link>
          <Link
            href="/smarrimenti"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Vedi smarrimenti
          </Link>
        </div>
      </main>
    );
  }

  const imgSrc =
    (item.primary_photo_url || "/placeholder-animal.jpg") +
    `?v=${encodeURIComponent(item.created_at)}`;

  return (
    <main className="max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {displaySpecies}
            {displayName ? ` – ${displayName}` : ""}
          </h1>
          <p className="mt-2 text-zinc-700">
            {(item.city || "—")} {item.province ? `(${item.province})` : ""} • Smarrito il{" "}
            {new Date(item.lost_date).toLocaleDateString("it-IT")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Stato annuncio: <span className="font-medium">{item.status === "active" ? "Attivo" : "Chiuso"}</span>
          </p>
        </div>

        <Link href="/smarrimenti" className="text-sm text-zinc-600 hover:underline">
          ← Indietro
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <img
          src={imgSrc}
          alt={displayName ? `${displaySpecies} – ${displayName}` : displaySpecies}
          className="h-80 w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/placeholder-animal.jpg";
          }}
        />
        <div className="p-6">
          <h2 className="text-base font-semibold">Descrizione</h2>
          <p className="mt-2 text-zinc-700">{item.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href={mapsUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Apri su Google Maps
            </a>

            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Copia link
            </button>

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Condividi su WhatsApp
            </a>

            <Link
              href="/miei-annunci"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Vai a “I miei annunci”
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <p className="font-medium text-zinc-900">Contatti (se disponibili)</p>
            <p className="mt-2 text-zinc-700">
              <span className="font-medium">Telefono:</span> {item.contact_phone || "Non disponibile"}
            </p>
            <p className="mt-1 text-zinc-700">
              <span className="font-medium">Email:</span> {item.contact_email || "Non disponibile"}
            </p>
          </div>

          {item.animal_id ? (
            <p className="mt-4 text-xs text-zinc-500">Collegato al profilo animale ✅</p>
          ) : (
            <p className="mt-4 text-xs text-zinc-500">Smarrimento rapido (non collegato a profilo)</p>
          )}
        </div>
      </div>
    </main>
  );
}
