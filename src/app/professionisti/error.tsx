"use client";

import Link from "next/link";

export default function ProfessionistiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Errore nel Portale Professionisti</h1>
      <p className="text-sm text-zinc-700">
        Si è verificato un errore. Per la demo, puoi tornare allo scanner o alla dashboard.
      </p>

      <div className="rounded-2xl border bg-white p-4 text-xs text-zinc-600 whitespace-pre-wrap">
        {String(error?.message || "Errore sconosciuto")}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button className="rounded-xl bg-black text-white px-3 py-2 text-sm" onClick={() => reset()}>
          Riprova
        </button>
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/professionisti/scansiona">
          Scanner
        </Link>
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/professionisti/dashboard">
          Dashboard
        </Link>
      </div>
    </div>
  );
}