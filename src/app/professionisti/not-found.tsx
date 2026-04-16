import Link from "next/link";

export default function ProfessionistiNotFound() {
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Pagina non trovata</h1>
      <p className="text-sm text-zinc-700">
        La pagina richiesta non esiste nel Portale Professionisti.
      </p>

      <div className="flex gap-2 flex-wrap">
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/professionisti/dashboard">
          Dashboard
        </Link>
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/professionisti/scansiona">
          Scanner
        </Link>
      </div>
    </div>
  );
}
