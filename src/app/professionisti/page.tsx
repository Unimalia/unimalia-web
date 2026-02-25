import Link from "next/link";

export default function ProfessionistiDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Dashboard</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Dopo la scansione di QRCode/Barcode si apre la scheda completa dell’animale (già esistente).
          Qui trovi strumenti rapidi per lavorare più veloce.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/professionisti/scansiona"
            className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900"
          >
            Scansiona
          </Link>
          <Link
            href="/professionisti/animali"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Animali
          </Link>
          <Link
            href="/professionisti/richieste"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Richieste consulto
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-zinc-500">Oggi</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">—</p>
          <p className="mt-1 text-sm text-zinc-600">Scansioni</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-zinc-500">In sospeso</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">—</p>
          <p className="mt-1 text-sm text-zinc-600">Richieste consulto</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-zinc-500">Ultimo accesso</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">—</p>
          <p className="mt-1 text-sm text-zinc-600">Attività</p>
        </div>
      </div>
    </div>
  );
}