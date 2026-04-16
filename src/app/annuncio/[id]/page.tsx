import type { Metadata } from "next";
import Image from "next/image";
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
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
        <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Annuncio UNIMALIA
              </span>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#30486f] sm:text-4xl">
                Annuncio non disponibile
              </h1>

              <p className="mt-4 text-sm leading-7 text-[#55657d] sm:text-base">
                Questo annuncio potrebbe non essere più disponibile pubblicamente.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/smarrimenti"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Vai agli smarrimenti
                </Link>

                <Link
                  href="/trovati"
                  className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                >
                  Vai a trovati / avvistati
                </Link>
              </div>
            </div>
          </div>
        </section>
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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6">
          <Link
            href={backHrefByType(reportType)}
            className="text-sm font-semibold text-[#5f708a] underline-offset-4 transition hover:text-[#30486f] hover:underline"
          >
            ← Torna a {backLabelByType(reportType)}
          </Link>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="bg-[linear-gradient(180deg,#fffaf9_0%,#ffffff_100%)] p-4 sm:p-6 lg:p-8">
              <div className="overflow-hidden rounded-[28px] border border-[#e7dfe1] bg-white">
                <div className="relative h-80 w-full sm:h-[440px]">
                  <Image
                    src={mainPhoto}
                    alt={title}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold text-[#5f708a]">
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

                  <h1 className="text-3xl font-semibold tracking-tight text-[#30486f] sm:text-4xl">
                    {title}
                  </h1>

                  <p className="mt-3 text-sm leading-7 text-[#55657d]">
                    {locationLabel(report) || "Località non disponibile"}
                  </p>

                  <p className="mt-1 text-sm leading-7 text-[#5f708a]">
                    Data evento: {formatEventDate(report.event_date)}
                  </p>
                </div>
              </div>

              {safeText(report.description) ? (
                <div className="mt-8 rounded-[24px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                    Descrizione
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#55657d]">
                    {safeText(report.description)}
                  </p>
                </div>
              ) : null}

              <div className="mt-8 grid gap-4">
                <div className="rounded-[24px] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#30486f]">Posizione</h3>
                  <p className="mt-3 text-sm leading-7 text-[#55657d]">
                    {safeText(report.location_text) || "Località non specificata"}
                    {safeText(report.province) ? ` (${safeText(report.province)})` : ""}
                  </p>

                  {showEmbeddedMap ? (
                    <div className="mt-4 overflow-hidden rounded-[20px] border border-[#dbe5ef] bg-white">
                      <iframe
                        title="Mappa posizione annuncio"
                        src={getOsmEmbedUrl(report.lat as number, report.lng as number)}
                        className="h-72 w-full border-0"
                        loading="lazy"
                      />
                    </div>
                  ) : null}

                  {showMap ? (
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,#2f69c7_0%,#2558ab_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,105,199,0.22)] transition hover:scale-[1.01]"
                    >
                      Apri su Google Maps
                    </a>
                  ) : (
                    <p className="mt-4 text-xs text-[#5f708a]">
                      Mappa non disponibile per questo annuncio.
                    </p>
                  )}
                </div>

                <div className="rounded-[24px] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#30486f]">Link annuncio</h3>
                  <p className="mt-3 text-sm leading-7 text-[#55657d]">
                    Questo è il link pubblico dell’annuncio.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={reportUrl}
                      className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                    >
                      Apri link annuncio
                    </a>
                  </div>

                  <p className="mt-3 text-xs leading-6 text-[#5f708a]">
                    La condivisione guidata dal sito è riservata solo al proprietario dall’area
                    privata di gestione.
                  </p>
                </div>
              </div>

              {safeText(report.public_phone) && isActive ? (
                <div className="mt-8 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                  <h3 className="text-lg font-semibold text-emerald-900">Contatto diretto</h3>
                  <p className="mt-2 text-sm leading-7 text-emerald-800">
                    Il segnalatore ha scelto di mostrare il telefono pubblicamente.
                  </p>
                  <p className="mt-3 text-base font-semibold text-emerald-900">
                    {safeText(report.public_phone)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 sm:p-8 lg:p-10">
            {isActive ? (
              <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
                  <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                    Contatto protetto
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#55657d]">
                    Scrivi un messaggio senza mostrare pubblicamente l’email del segnalatore.
                  </p>

                  <div className="mt-5">
                    <ContactProtectedForm reportId={report.id} />
                  </div>
                </div>

                <div className="rounded-[30px] border border-[#dbe5ef] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8">
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                    Messaggio protetto
                  </span>

                  <h3 className="mt-5 text-3xl font-semibold tracking-tight">
                    Un modo più sicuro per aiutare
                  </h3>

                  <p className="mt-5 text-sm leading-8 text-white/85">
                    Il sistema di contatto protetto permette di inviare informazioni utili senza
                    esporre subito i recapiti privati del segnalatore.
                  </p>

                  <div className="mt-8 space-y-4">
                    <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                      <h4 className="text-lg font-semibold">Più privacy</h4>
                      <p className="mt-2 text-sm leading-7 text-white/80">
                        L’email del segnalatore non viene mostrata pubblicamente nella pagina.
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                      <h4 className="text-lg font-semibold">Più ordine</h4>
                      <p className="mt-2 text-sm leading-7 text-white/80">
                        Il contatto avviene in modo più chiaro e utile per chi deve inviare una
                        segnalazione concreta.
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                      <h4 className="text-lg font-semibold">Più affidabilità</h4>
                      <p className="mt-2 text-sm leading-7 text-white/80">
                        Un flusso più controllato aiuta a mantenere gli annunci più seri e più
                        sicuri per tutti.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 sm:p-8">
                <h2 className="text-2xl font-semibold tracking-tight text-amber-900">
                  Annuncio chiuso
                </h2>
                <p className="mt-3 text-sm leading-7 text-amber-800">
                  Questo annuncio non è più attivo, quindi i contatti pubblici e il contatto
                  protetto non sono più disponibili.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}