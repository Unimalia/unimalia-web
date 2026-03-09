// src/app/professionisti/dashboard/page.tsx
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

export default function ProDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Hub operativo del Portale Professionisti.
      </p>

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
          href="/professionisti/richieste-accesso"
          title="Richieste accesso"
          desc="Invia nuove richieste e monitora lo stato."
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