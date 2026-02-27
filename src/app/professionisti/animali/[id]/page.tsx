// src/app/professionisti/animali/[id]/page.tsx
import Link from "next/link";

export default function ProfessionistiAnimalePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Animale (Professionisti)</h2>

        <p className="mt-2 text-sm text-zinc-600">
          Qui mostreremo la scheda animale professionista collegata ai dati reali (owner, microchip verificato,
          cartella clinica, eventi, azioni rapide).
        </p>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Privacy</div>
          <div className="mt-1 opacity-90">
            Le identità NON sono pubbliche. Possono vederle solo il proprietario (owner) o un professionista
            autorizzato tramite codice/scan.
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/professionisti/scansiona"
            className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900"
          >
            Torna allo scanner
          </Link>

          <Link
            href="/professionisti/richieste"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Vai alle richieste
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900">Ultimi eventi / verifiche</h3>
          <span className="text-xs text-zinc-500">In arrivo</span>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
          Qui mostreremo: microchip (verificato o no), ultimi eventi clinici, log verifiche, azioni rapide.
        </div>
      </div>
    </div>
  );
}