import Link from "next/link";

export default function ProfessionistiAnimaliPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Animali</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Qui gestirai elenco e ricerca. Per ora è una base pronta da collegare ai dati reali.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/professionisti/scansiona"
            className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900"
          >
            Scansiona QR/Barcode
          </Link>
          <Link
            href="/identita"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Vai alle identità (pubblico)
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900">Ultimi animali visualizzati</h3>
          <span className="text-xs text-zinc-500">In arrivo</span>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
          Qui mostreremo gli ultimi animali verificati (ID, nome, specie, data/ora, azioni rapide).
        </div>
      </div>
    </div>
  );
}