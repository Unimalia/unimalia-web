"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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
        setItem(data as unknown as LostEvent);
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

  // embed pubblico (senza API key)
  function mapsEmbedUrl() {
    if (!item) return "";
    if (item.lat != null && item.lng != null) {
      return `https://www.google.com/maps?q=${item.lat},${item.lng}&output=embed`;
    }
    const q = `${item.city || ""} ${item.province || ""} Italia`.trim();
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
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
    const text = `🐾 ANIMALE SMARRITO\n${displaySpecies}${
      displayName ? " – " + displayName : ""
    }\n${item.city || ""} ${item.province ? "(" + item.province + ")" : ""}\nLink: ${link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  if (loading) {
    return (
      <PageShell
        title="Annuncio smarrimento"
        subtitle="Caricamento…"
        backFallbackHref="/smarrimenti"
        actions={
          <>
            <ButtonSecondary href="/smarrimenti">Smarrimenti</ButtonSecondary>
            <ButtonPrimary href="/smarrimenti/nuovo">+ Nuovo</ButtonPrimary>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="h-72 rounded-2xl border border-zinc-200 bg-white shadow-sm" />
          <div className="h-40 rounded-2xl border border-zinc-200 bg-white shadow-sm" />
        </div>
      </PageShell>
    );
  }

  if (error || !item) {
    return (
      <PageShell
        title="Annuncio smarrimento"
        subtitle="Non riesco a trovare questo annuncio."
        backFallbackHref="/smarrimenti"
        actions={
          <>
            <ButtonSecondary href="/">Home</ButtonSecondary>
            <ButtonPrimary href="/smarrimenti">Vedi smarrimenti</ButtonPrimary>
          </>
        }
      >
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error || "Annuncio non trovato."}
        </div>
      </PageShell>
    );
  }

  const imgSrc =
    (item.primary_photo_url || "/placeholder-animal.jpg") +
    `?v=${encodeURIComponent(item.created_at)}`;

  const title = `${displaySpecies}${displayName ? ` – ${displayName}` : ""}`;

  const subtitle = `${item.city || "—"}${item.province ? ` (${item.province})` : ""} • Smarrito il ${new Date(
    item.lost_date
  ).toLocaleDateString("it-IT")}`;

  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      backFallbackHref="/smarrimenti"
      boxed={false}
      actions={
        <>
          <ButtonSecondary href="/miei-annunci">I miei annunci</ButtonSecondary>
          <ButtonSecondary href={mapsUrl()}>Google Maps</ButtonSecondary>
          <ButtonPrimary href="/smarrimenti">Torna alla lista</ButtonPrimary>
        </>
      }
    >
      <div className="grid gap-6">
        {/* HERO CARD */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <img
            src={imgSrc}
            alt={title}
            className="h-80 w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/placeholder-animal.jpg";
            }}
          />

          <div className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600">
                Stato annuncio:{" "}
                <span className="font-semibold text-zinc-900">
                  {item.status === "active" ? "Attivo" : "Chiuso"}
                </span>
              </p>

              <p className="text-xs text-zinc-500">
                Pubblicato il {new Date(item.created_at).toLocaleDateString("it-IT")}
              </p>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-12">
              {/* Descrizione + Azioni */}
              <div className="md:col-span-7">
                <h2 className="text-base font-semibold text-zinc-900">Descrizione</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
                  {item.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    Copia link
                  </button>

                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    Condividi su WhatsApp
                  </a>

                  <a
                    href={mapsUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Apri su Maps
                  </a>
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  {item.animal_id
                    ? "Collegato al profilo animale ✅"
                    : "Smarrimento rapido (non collegato a profilo)"}
                </p>
              </div>

              {/* Contatti */}
              <div className="md:col-span-5">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">Contatti</p>

                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-500">Telefono</span>
                      <span className="font-medium text-zinc-900">
                        {item.contact_phone || "Non disponibile"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-500">Email</span>
                      <span className="font-medium text-zinc-900">
                        {item.contact_email || "Non disponibile"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href="/miei-annunci"
                      className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Vai a “I miei annunci”
                    </Link>
                  </div>

                  <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                    Se trovi l’animale, contatta subito il proprietario. Se non risponde, salva il link e riprova.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAPPA SEMPRE VISIBILE */}
        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-zinc-900">Posizione</p>
              <p className="mt-1 text-sm text-zinc-600">
                {item.lat != null && item.lng != null
                  ? "Coordinate disponibili."
                  : "Posizione stimata dalla città/provincia."}
              </p>
            </div>

            <a
              href={mapsUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Apri su Google Maps
            </a>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            <iframe
              title={`Mappa ${item.id}`}
              src={mapsEmbedUrl()}
              className="h-80 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}