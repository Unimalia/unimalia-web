import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import ContactProtectedForm from "./ContactProtectedForm";

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PageProps = {
  params: Promise<{ id: string }>;
};

type ReportPublicRow = {
  id: string;
  created_at?: string | null;
  type?: "lost" | "found" | "sighted" | string | null;
  status?: string | null;
  title?: string | null;
  animal_name?: string | null;
  species?: string | null;
  region?: string | null;
  province?: string | null;
  location_text?: string | null;
  event_date?: string | null;
  description?: string | null;
  photo_urls?: unknown;
  public_phone?: string | null;
  lat?: number | null;
  lng?: number | null;
};

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function safePhotoUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function formatTypeLabel(type: string) {
  if (type === "lost") return "Smarrito";
  if (type === "found") return "Trovato";
  if (type === "sighted") return "Avvistato";
  return "Annuncio";
}

function formatStatusLabel(type: string, status: string) {
  if (status === "closed_found" && type === "lost") return "Lieto fine";
  if (status === "closed_found") return "Chiuso";
  if (status === "closed_other") return "Chiuso";
  if (status === "expired") return "Scaduto";
  return "Attivo";
}

function pageTitle(data: ReportPublicRow) {
  const animal = safeText(data.animal_name).trim();
  const species = safeText(data.species).trim();
  const title = safeText(data.title).trim();

  if (animal && species) return `${animal} – ${species}`;
  if (animal) return animal;
  if (species) return species;
  if (title) return title;
  return "Annuncio";
}

function locationLabel(data: ReportPublicRow) {
  const location = safeText(data.location_text).trim();
  const province = safeText(data.province).trim();
  const region = safeText(data.region).trim();

  const parts = [location, province, region].filter(Boolean);
  return parts.join(", ");
}

function ogTitle(data: ReportPublicRow) {
  const base = pageTitle(data);
  const type = safeText(data.type);
  const typeText =
    type === "lost"
      ? "smarrito"
      : type === "found"
        ? "trovato"
        : type === "sighted"
          ? "avvistato"
          : "segnalato";

  const place = locationLabel(data);

  if (place) {
    return `${base} ${typeText} – ${place}`;
  }

  return `${base} ${typeText}`;
}

function mapsUrl(data: ReportPublicRow) {
  if (typeof data.lat === "number" && typeof data.lng === "number") {
    return `https://www.google.com/maps?q=${data.lat},${data.lng}`;
  }

  const q = `${safeText(data.location_text)} ${safeText(data.province)} ${safeText(data.region)} Italia`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function formatEventDate(value: string | null | undefined) {
  if (!value) return "Data non disponibile";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Data non disponibile";
  return d.toLocaleDateString("it-IT");
}

function backHrefByType(type: string) {
  if (type === "lost") return "/smarrimenti";
  return "/trovati";
}

function backLabelByType(type: string) {
  if (type === "lost") return "Smarrimenti";
  return "Trovati / Avvistati";
}

function hasMeaningfulLocation(report: ReportPublicRow) {
  return Boolean(
    safeText(report.location_text).trim() ||
      safeText(report.province).trim() ||
      safeText(report.region).trim() ||
      (typeof report.lat === "number" && typeof report.lng === "number")
  );
}

function hasCoordinates(report: ReportPublicRow) {
  return typeof report.lat === "number" && typeof report.lng === "number";
}

function getOsmEmbedUrl(lat: number, lng: number) {
  const delta = 0.008;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}

async function loadReport(id: string) {
  const { data } = await supabasePublic
    .from("reports_public")
    .select("*")
    .eq("id", id)
    .single();

  return (data as ReportPublicRow | null) ?? null;
}

function buildMetaDescription(report: ReportPublicRow) {
  const typeLabel = formatTypeLabel(safeText(report.type));
  const title = pageTitle(report);
  const place = locationLabel(report);
  const date = formatEventDate(report.event_date);

  return `${typeLabel}: ${title}. Località: ${place || "non specificata"}. Data evento: ${date}. Pubblicato su UNIMALIA.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await loadReport(id);

  if (!report) {
    return {
      title: "Annuncio non disponibile",
      description: "Questo annuncio non è disponibile.",
    };
  }

  const title = ogTitle(report);
  const description = buildMetaDescription(report);
  const image = safePhotoUrls(report.photo_urls)[0] || "/placeholder-animal.jpg";
  const url = `${process.env.PUBLIC_BASE_URL || "https://www.unimalia.it"}/annuncio/${report.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/annuncio/${report.id}`,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [
        {
          url: image,
          alt: title,
        },
      ],
      locale: "it_IT",
      siteName: "UNIMALIA",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function AnnuncioPage({ params }: PageProps) {
  const { id } = await params;
  const report = await loadReport(id);

  if (!report) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Annuncio non disponibile
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Questo annuncio potrebbe non essere più disponibile pubblicamente.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/smarrimenti"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Vai agli smarrimenti
            </Link>

            <Link
              href="/trovati"
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Vai a trovati / avvistati
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const reportType = safeText(report.type);
  const reportStatus = safeText(report.status);
  const title = pageTitle(report);
  const reportUrl = `${process.env.PUBLIC_BASE_URL || "https://www.unimalia.it"}/annuncio/${report.id}`;
  const mapsHref = mapsUrl(report);
  const photoUrls = safePhotoUrls(report.photo_urls);
  const mainPhoto = photoUrls[0] || "/placeholder-animal.jpg";
  const showMap = hasMeaningfulLocation(report);
  const showEmbeddedMap = hasCoordinates(report);
  const isActive = reportStatus === "active";
  const isClosed = !isActive;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={backHrefByType(reportType)}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Torna a {backLabelByType(reportType)}
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <img
          src={mainPhoto}
          alt={title}
          className="h-72 w-full object-cover sm:h-96"
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {formatTypeLabel(reportType)}
                </span>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    isActive
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {formatStatusLabel(reportType, reportStatus)}
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {title}
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                {locationLabel(report) || "Località non disponibile"}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Data evento: {formatEventDate(report.event_date)}
              </p>
            </div>
          </div>

          {safeText(report.description) ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Descrizione
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                {safeText(report.description)}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">Posizione</h3>
              <p className="mt-3 text-sm text-zinc-700">
                {safeText(report.location_text) || "Località non specificata"}
                {safeText(report.province) ? ` (${safeText(report.province)})` : ""}
              </p>

              {showEmbeddedMap ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <iframe
                    title="Mappa posizione annuncio"
                    src={getOsmEmbedUrl(report.lat as number, report.lng as number)}
                    className="h-64 w-full border-0"
                    loading="lazy"
                  />
                </div>
              ) : null}

              {showMap ? (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Apri su Google Maps
                </a>
              ) : (
                <p className="mt-4 text-xs text-zinc-500">
                  Mappa non disponibile per questo annuncio.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">Link annuncio</h3>
              <p className="mt-3 text-sm text-zinc-700">
                Questo è il link pubblico dell’annuncio.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={reportUrl}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                >
                  Apri link annuncio
                </a>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                La condivisione guidata dal sito è riservata solo al proprietario dall’area privata di gestione.
              </p>
            </div>
          </div>

          {safeText(report.public_phone) && isActive ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="text-sm font-semibold text-emerald-900">Contatto diretto</h3>
              <p className="mt-2 text-sm text-emerald-800">
                Il segnalatore ha scelto di mostrare il telefono pubblicamente.
              </p>
              <p className="mt-3 text-sm font-semibold text-emerald-900">
                {safeText(report.public_phone)}
              </p>
            </div>
          ) : null}

          {isActive ? (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-zinc-900">Contatto protetto</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Scrivi un messaggio senza mostrare pubblicamente l’email del segnalatore.
              </p>

              <div className="mt-4">
                <ContactProtectedForm reportId={report.id} />
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-lg font-semibold text-amber-900">Annuncio chiuso</h2>
              <p className="mt-2 text-sm text-amber-800">
                Questo annuncio non è più attivo, quindi i contatti pubblici e il contatto protetto non sono più disponibili.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}