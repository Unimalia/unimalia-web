// src/app/professionisti/dashboard/page.tsx
export const dynamic = "force-dynamic";

export default function ProfessionistiDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Hub operativo del Portale Professionisti.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <a
          href="/professionisti/scansiona"
          className="rounded-xl border bg-white p-4 hover:bg-neutral-50"
        >
          <div className="text-sm font-semibold">Scansiona</div>
          <div className="mt-1 text-sm text-neutral-600">
            Microchip / QR per aprire rapidamente un animale.
          </div>
        </a>

        <a
          href="/professionisti/animali"
          className="rounded-xl border bg-white p-4 hover:bg-neutral-50"
        >
          <div className="text-sm font-semibold">Animali in gestione</div>
          <div className="mt-1 text-sm text-neutral-600">
            Lista animali con grant attivo (nessuna ricerca globale).
          </div>
        </a>

        <a
          href="/professionisti/richieste"
          className="rounded-xl border bg-white p-4 hover:bg-neutral-50"
        >
          <div className="text-sm font-semibold">Richieste</div>
          <div className="mt-1 text-sm text-neutral-600">
            Gestisci richieste e consensi (quando attivo).
          </div>
        </a>

        <a
          href="/professionisti/impostazioni"
          className="rounded-xl border bg-white p-4 hover:bg-neutral-50"
        >
          <div className="text-sm font-semibold">Impostazioni</div>
          <div className="mt-1 text-sm text-neutral-600">
            Profilo, organizzazione, preferenze.
          </div>
        </a>
      </div>
    </div>
  );
}