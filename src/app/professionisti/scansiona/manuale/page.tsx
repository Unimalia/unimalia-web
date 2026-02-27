"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

export default function ScansionaManualePage() {
  const sp = useSearchParams();
  const value = sp.get("value") || "";
  const chip = useMemo(() => digitsOnly(value), [value]);

  const isChip = chip.length >= 10 && chip.length <= 20;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gestione manuale</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Questo codice non risulta associato a nessun animale. Scegli cosa fare.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-zinc-900">Valore letto</div>
        <div className="mt-2 break-all rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
          {value || "—"}
        </div>

        {isChip ? (
          <>
            <div className="mt-4 text-sm text-zinc-700">
              Microchip normalizzato: <span className="font-semibold">{chip}</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/identita/nuovo?chip=${encodeURIComponent(chip)}`}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Crea nuova identità con microchip
              </Link>

              <Link
                href={`/professionisti/animali?associateChip=${encodeURIComponent(chip)}`}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Associa a animale esistente (poi)
              </Link>

              <Link
                href="/professionisti/scansiona"
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                ← Torna allo scanner
              </Link>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Nota: per ora la seconda opzione è un aggancio al futuro flusso “associa chip”.
            </p>
          </>
        ) : (
          <div className="mt-4 text-sm text-zinc-600">
            Il valore non sembra un microchip (10–20 cifre). Torna allo scanner o incolla un link/UUID.
          </div>
        )}
      </div>
    </div>
  );
}