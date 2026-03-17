import Link from "next/link";
import ClinicAgendaDashboardWidget from "@/_components/professionisti/ClinicAgendaDashboardWidget";

function CardLink({
  href,
  title,
  desc,
  right,
}: {
  href: string;
  title: string;
  desc: string;
  right?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:bg-zinc-50 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold">{title}</div>
          <div className="mt-1 text-sm text-zinc-600">{desc}</div>
        </div>

        {right ? (
          <div className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
            {right}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export const dynamic = "force-dynamic";

export default async function ProDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const resolved = await searchParams;
  const showPendingBanner = resolved?.pending === "1";

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Hub operativo del Portale Professionisti.
      </p>

      {showPendingBanner ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">Profilo in verifica</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-800">
            La scheda professionista è stata salvata correttamente. Il profilo sarà verificato entro 24/48 ore
            prima dell’abilitazione completa delle funzioni riservate.
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <ClinicAgendaDashboardWidget />
      </div>

      <div className="mt-6 grid gap-3">
        <CardLink
          href="/professionisti/scansiona"
          title="Scansiona"
          desc="Microchip / QR per aprire rapidamente un animale."
        />

        <CardLink
          href="/professionisti/animali"
          title="Animali in gestione"
          desc="Vedi solo animali con grant attivo per la tua struttura."
        />

        <CardLink
          href="/professionisti/richieste"
          title="Consulti veterinari"
          desc="Invia, ricevi e gestisci consulenze cliniche con altri veterinari, con condivisione della cartella animale."
        />

        <CardLink
          href="/professionisti/agenda"
          title="Agenda clinica"
          desc="Agenda integrata con appuntamenti, turni veterinari, stanze e accesso rapido alla gestione completa."
        />

        <CardLink
          href="/professionisti/impostazioni/agenda"
          title="Impostazioni agenda"
          desc="Configura veterinari, turni settimanali, override per data, stanze e prestazioni."
        />

        <CardLink
          href="/professionisti/impostazioni"
          title="Impostazioni"
          desc="Profilo, organizzazione, preferenze."
        />
      </div>
    </div>
  );
}