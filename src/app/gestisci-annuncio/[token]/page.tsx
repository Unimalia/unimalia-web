import Image from "next/image";
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
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
        <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="rounded-[1.9rem] border border-[#e3e9f0] bg-white p-8 shadow-[0_12px_32px_rgba(42,56,86,0.06)]">
            <h1 className="text-2xl font-semibold tracking-tight text-[#30486f]">
              Link di gestione non valido
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#5f708a]">
              Questo link potrebbe essere scaduto, errato oppure non più disponibile.
            </p>

            <div className="mt-6">
              <Link
                href="/smarrimenti"
                className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] hover:bg-[#263b59]"
              >
                Vai agli smarrimenti
              </Link>
            </div>
          </div>
        </section>
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_12px_32px_rgba(42,56,86,0.06)]">
          <div className="relative h-72 w-full sm:h-96">
            <Image
              src={mainPhoto}
              alt={safeCardTitle(report)}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <span className="inline-flex rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Area privata proprietario
              </span>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f] sm:text-3xl">
                Gestisci il tuo annuncio
              </h1>

              <p className="mt-2 text-sm leading-7 text-[#5f708a]">
                Questa pagina è privata. Conservala: da qui puoi gestire l’annuncio senza
                registrarti.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-[#f8fbff] p-5">
              <h2 className="text-lg font-semibold text-[#30486f]">{safeCardTitle(report)}</h2>

              <p className="mt-2 text-sm text-[#5f708a]">
                {[report.location_text, report.province, report.region].filter(Boolean).join(" • ") ||
                  "Località non disponibile"}
              </p>

              <p className="mt-1 text-sm text-[#6f7d91]">Data evento: {safeDate(report.event_date)}</p>

              <p className="mt-2 text-sm text-[#6f7d91]">
                Stato:{" "}
                <span className="font-semibold text-[#30486f]">
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
      </section>
    </main>
  );
}