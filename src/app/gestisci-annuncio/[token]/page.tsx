import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import ManageReportActions from "./ManageReportActions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

type ManagedReport = {
  id: string;
  title: string | null;
  type: "lost" | "found" | "sighted";
  status: string;
  animal_name: string | null;
  species: string | null;
  region: string | null;
  province: string | null;
  location_text: string | null;
  event_date: string | null;
  photo_urls: string[] | null;
  contact_email: string | null;
  claim_token: string;
};

function safeDate(value: string | null | undefined) {
  if (!value) return "Data non disponibile";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Data non disponibile";
  return d.toLocaleDateString("it-IT");
}

function safeCardTitle(item: ManagedReport) {
  if (item.animal_name && item.species) return `${item.animal_name} – ${item.species}`;
  if (item.animal_name) return item.animal_name;
  if (item.species) return item.species;
  if (item.title) return item.title;
  return "Annuncio";
}

function shareText(report: ManagedReport, publicUrl: string) {
  const title = safeCardTitle(report);
  const place = [report.location_text, report.province, report.region].filter(Boolean).join(", ");

  if (report.type === "lost") {
    return `AIUTACI A CONDIVIDERE

SMARRITO: ${title}
Zona: ${place || "zona non specificata"}
Data: ${safeDate(report.event_date)}

Tutte le informazioni aggiornate:
${publicUrl}

Pubblicato su UNIMALIA`;
  }

  if (report.type === "found") {
    return `ANIMALE TROVATO

Segnalazione: ${title}
Zona: ${place || "zona non specificata"}
Data: ${safeDate(report.event_date)}

Dettagli:
${publicUrl}

Pubblicato su UNIMALIA`;
  }

  return `ANIMALE AVVISTATO

Segnalazione: ${title}
Zona: ${place || "zona non specificata"}
Data: ${safeDate(report.event_date)}

Dettagli:
${publicUrl}

Pubblicato su UNIMALIA`;
}

export default async function GestisciAnnuncioPage({ params }: PageProps) {
  const { token } = await params;

  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("reports")
    .select(`
      id,
      title,
      type,
      status,
      animal_name,
      species,
      region,
      province,
      location_text,
      event_date,
      photo_urls,
      contact_email,
      claim_token
    `)
    .eq("claim_token", token)
    .single();

  if (error || !data) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Link di gestione non valido
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Questo link potrebbe essere scaduto, errato oppure non più disponibile.
          </p>

          <div className="mt-6">
            <Link
              href="/smarrimenti"
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Vai agli smarrimenti
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const report = data as ManagedReport;
  const publicUrl = `${process.env.PUBLIC_BASE_URL || "https://www.unimalia.it"}/annuncio/${report.id}`;
  const manageUrl = `${process.env.PUBLIC_BASE_URL || "https://www.unimalia.it"}/gestisci-annuncio/${report.claim_token}`;
  const textForFacebook = shareText(report, publicUrl);
  const mainPhoto =
    Array.isArray(report.photo_urls) && report.photo_urls.length > 0
      ? report.photo_urls[0]
      : "/placeholder-animal.jpg";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <img
          src={mainPhoto}
          alt={safeCardTitle(report)}
          className="h-72 w-full rounded-t-3xl object-cover sm:h-96"
        />

        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
              Area privata proprietario
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Gestisci il tuo annuncio
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Questa pagina è privata. Conservala: da qui puoi gestire l’annuncio senza registrarti.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-lg font-semibold text-zinc-900">{safeCardTitle(report)}</h2>
            <p className="mt-2 text-sm text-zinc-700">
              {[report.location_text, report.province, report.region].filter(Boolean).join(" • ") || "Località non disponibile"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">Data evento: {safeDate(report.event_date)}</p>
            <p className="mt-2 text-sm text-zinc-500">
              Stato:{" "}
              <span className="font-semibold text-zinc-800">
                {report.status === "active" ? "attivo" : "chiuso / ritrovato"}
              </span>
            </p>
          </div>

          <div className="mt-6">
            <ManageReportActions
              token={report.claim_token}
              type={report.type}
              status={report.status}
              publicUrl={publicUrl}
              manageUrl={manageUrl}
              textForFacebook={textForFacebook}
            />
          </div>
        </div>
      </div>
    </main>
  );
}