// src/app/professionisti/page.tsx
import Link from "next/link";

export default function ProfessionistiHome() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-10">
      {/* HERO */}
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Area Professionisti</h1>
        <p className="text-base opacity-80">
          Accesso operativo per veterinari, rifugi, forze dell’ordine e operatori autorizzati.
          Scansione microchip, verifica rapida e gestione delle richieste.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/professionisti/scansiona"
            className="rounded-2xl border px-4 py-2 hover:shadow transition"
          >
            Accedi allo scanner
          </Link>

          <Link
            href="/professionisti/richieste"
            className="rounded-2xl border px-4 py-2 hover:shadow transition"
          >
            Gestisci richieste
          </Link>
        </div>
      </section>

      {/* CARDS */}
      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/professionisti/scansiona"
          className="rounded-2xl border p-5 hover:shadow transition"
        >
          <div className="text-lg font-medium">🔍 Scansiona Microchip</div>
          <div className="text-sm opacity-70 mt-1">
            Fotocamera (ZXing), inserimento manuale e lettore USB HID.
          </div>
          <div className="text-xs opacity-60 mt-3">
            Supporto: QR UNIMALIA · UUID · Microchip 15 cifre · Lettore USB · Camera
          </div>
        </Link>

        <Link
          href="/professionisti/richieste"
          className="rounded-2xl border p-5 hover:shadow transition"
        >
          <div className="text-lg font-medium">📋 Richieste</div>
          <div className="text-sm opacity-70 mt-1">
            Gestione operativa di segnalazioni e flussi collegati.
          </div>
          <div className="text-xs opacity-60 mt-3">
            (Sezione in evoluzione: UI sempre stabile, niente pagine “vuote”.)
          </div>
        </Link>
      </section>

      {/* ISTITUZIONALE / TRUST */}
      <section className="rounded-2xl border p-5 space-y-3">
        <h2 className="text-base font-semibold">Accesso e governance</h2>
        <p className="text-sm opacity-75">
          L’area professionisti è progettata per un utilizzo responsabile e tracciabile.
          In caso di accesso non autorizzato o necessità operative, è possibile richiedere abilitazione.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/professionisti/richiedi-accesso"
            className="rounded-2xl border px-4 py-2 hover:shadow transition"
          >
            Richiedi accesso
          </Link>

          <Link
            href="/privacy"
            className="rounded-2xl border px-4 py-2 hover:shadow transition"
          >
            Privacy
          </Link>
        </div>
      </section>
    </main>
  );
}