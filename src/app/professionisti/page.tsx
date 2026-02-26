// src/app/professionisti/page.tsx

import Link from "next/link";

export default function ProfessionistiHome() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Area Professionisti
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/professionisti/scansiona"
          className="rounded-2xl border p-4 hover:shadow transition"
        >
          <div className="text-lg font-medium">🔍 Scansiona Microchip</div>
          <div className="text-sm opacity-70">
            Scanner tramite fotocamera, inserimento manuale o lettore USB
          </div>
        </Link>

        <Link
          href="/professionisti/richieste"
          className="rounded-2xl border p-4 hover:shadow transition"
        >
          <div className="text-lg font-medium">📋 Richieste</div>
          <div className="text-sm opacity-70">
            Gestisci richieste e segnalazioni
          </div>
        </Link>
      </div>
    </div>
  );
}