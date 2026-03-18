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

function formatTypeLabel(type: string) {
  if (type === "lost") return "Smarrito";
  if (type === "found") return "Trovato";
  if (type === "sighted") return "Avvistato";
  return type;
}

function pageTitle(data: any) {
  const animal = data.animal_name?.trim();
  const species = data.species?.trim();

  if (animal && species) return `${animal} – ${species}`;
  if (animal) return animal;
  if (species) return species;
  return data.title || "Annuncio";
}

function mapsUrl(data: any) {
  if (typeof data.lat === "number" && typeof data.lng === "number") {
    return `https://www.google.com/maps?q=${data.lat},${data.lng}`;
  }

  const q = `${data.location_text || ""} ${data.province || ""} ${data.region || ""} Italia`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function facebookShareUrl(data: any, reportUrl: string) {
  const shareText =
    data.type === "lost"
      ? `Aiutaci a condividere questo smarrimento pubblicato su UNIMALIA`
      : data.type === "found"
      ? `Aiutaci a condividere questo animale trovato pubblicato su UNIMALIA`
      : `Aiutaci a condividere questo avvistamento pubblicato su UNIMALIA`;

  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reportUrl)}&quote=${encodeURIComponent(
    shareText
  )}`;
}

export default async function AnnuncioPage({ params }: PageProps) {
  const { id } = await params;

  const { data, error } = await supabasePublic
    .from("reports_public")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return <div style={{ padding: 24 }}>Annuncio non disponibile.</div>;
  }

  const reportUrl = `${process.env.PUBLIC_BASE_URL || "https://www.unimalia.it"}/annuncio/${data.id}`;
  const title = pageTitle(data);
  const mapsHref = mapsUrl(data);
  const shareHref = facebookShareUrl(data, reportUrl);
  const mainPhoto =
    Array.isArray(data.photo_urls) && data.photo_urls.length > 0
      ? data.photo_urls[0]
      : "/placeholder-animal.jpg";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={data.type === "lost" ? "/smarrimenti" : "/trovati"}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Torna a {data.type === "lost" ? "Smarrimenti" : "Trovati / Avvistati"}
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <img
          src={mainPhoto}
          alt={title}
          className="h-72 w-full object-cover sm:h-96"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/placeholder-animal.jpg";
          }}
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                {formatTypeLabel(data.type)}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {title}
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                {data.region} • {data.province} • {data.location_text}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Data evento: {new Date(data.event_date).toLocaleDateString("it-IT")}
              </p>
            </div>
          </div>

          {data.description ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Descrizione
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                {data.description}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">Posizione</h3>
              <p className="mt-3 text-sm text-zinc-700">
                {data.location_text}
                {data.province ? ` (${data.province})` : ""}
              </p>

              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Apri su Google Maps
              </a>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">Condivisione</h3>
              <p className="mt-3 text-sm text-zinc-700">
                Condividi questo annuncio sui social per aumentare la visibilità e aiutare il rientro.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={shareHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                >
                  Condividi su Facebook
                </a>

                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                >
                  Copia link annuncio
                </a>
              </div>
            </div>
          </div>

          {data.public_phone ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="text-sm font-semibold text-emerald-900">Contatto diretto</h3>
              <p className="mt-2 text-sm text-emerald-800">
                Il segnalatore ha scelto di mostrare il telefono pubblicamente.
              </p>
              <p className="mt-3 text-sm font-semibold text-emerald-900">{data.public_phone}</p>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Contatto protetto</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Scrivi un messaggio senza mostrare pubblicamente l’email del segnalatore. UNIMALIA inoltrerà il tuo messaggio in modo protetto.
            </p>

            <div className="mt-4">
              <ContactProtectedForm reportId={data.id} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}