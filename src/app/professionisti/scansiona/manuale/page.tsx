"use client";

import React, { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

export default function ManualScanHandlerPage() {
  const params = useSearchParams();
  const router = useRouter();

  const rawValue = params.get("value") ?? "";
  const chipDigits = useMemo(() => digitsOnly(rawValue), [rawValue]);

  const chipLooksValid = chipDigits.length === 15 || chipDigits.length === 10;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Gestione manuale microchip</h1>
        <button
          type="button"
          className="rounded-xl border px-3 py-2 text-sm"
          onClick={() => router.push("/professionisti/scansiona")}
        >
          ← Torna allo scanner
        </button>
      </div>

      <div className="rounded-2xl border p-4 space-y-2">
        <div className="text-sm font-medium">Valore letto</div>
        <div className="rounded-xl border bg-zinc-50 p-3 text-sm break-all">
          {rawValue ? rawValue : "—"}
        </div>

        <div className="text-sm font-medium mt-3">Microchip normalizzato (solo cifre)</div>
        <div className="rounded-xl border bg-zinc-50 p-3 text-sm break-all">
          {chipDigits ? chipDigits : "—"}
        </div>

        {!chipLooksValid ? (
          <div className="mt-3 rounded-xl border bg-amber-50 p-3 text-sm">
            <div className="font-medium">Attenzione</div>
            <div className="opacity-80">
              Questo valore non sembra un microchip valido (atteso 15 cifre, opzionale 10).
              Se hai scansionato un barcode (13 cifre) o un QR non UNIMALIA, torna indietro e riprova.
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border bg-zinc-50 p-3 text-sm">
            <div className="font-medium">Cosa vuoi fare?</div>
            <div className="opacity-80">
              Il microchip non è stato trovato nel database. Puoi creare una nuova identità oppure associarlo
              a un animale esistente.
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <div className="text-sm font-medium">Azioni</div>

        <button
          type="button"
          className="w-full rounded-xl border px-3 py-2 text-sm"
          disabled={!chipLooksValid}
          onClick={() => router.push(`/identita/nuovo?chip=${encodeURIComponent(chipDigits)}`)}
        >
          ➕ Crea nuova identità con questo microchip
        </button>

        <button
          type="button"
          className="w-full rounded-xl border px-3 py-2 text-sm"
          disabled={!chipLooksValid}
          onClick={() =>
            router.push(`/professionisti/scansiona/manuale/associa?chip=${encodeURIComponent(chipDigits)}`)
          }
        >
          🔗 Associa a animale esistente (prima versione)
        </button>

        <div className="text-xs opacity-70">
          Nota: la pagina “associa” la completiamo subito dopo (ricerca animali + update chip su animale scelto).
        </div>
      </div>
    </div>
  );
}