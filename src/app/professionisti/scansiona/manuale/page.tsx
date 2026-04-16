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

  const chip = chipDigits;
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
          â† Torna allo scanner
        </button>
      </div>

      <div className="rounded-2xl border p-4 space-y-2">
        <div className="text-sm font-medium">Valore letto</div>
        <div className="rounded-xl border bg-zinc-50 p-3 text-sm break-all">
          {rawValue ? rawValue : "â€”"}
        </div>

        <div className="text-sm font-medium mt-3">
          Microchip normalizzato (solo cifre)
        </div>
        <div className="rounded-xl border bg-zinc-50 p-3 text-sm break-all">
          {chipDigits ? chipDigits : "â€”"}
        </div>

        {!chipLooksValid ? (
          <div className="mt-3 rounded-xl border bg-amber-50 p-3 text-sm">
            <div className="font-medium">Attenzione</div>
            <div className="opacity-80">
              Questo valore non sembra un microchip valido (atteso 15 cifre,
              opzionale 10). Se hai scansionato un barcode (13 cifre) o un QR
              non UNIMALIA, torna indietro e riprova.
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border bg-zinc-50 p-3 text-sm">
            <div className="font-medium">Nuovo flusso</div>
            <div className="opacity-80">
              Prima verifichiamo se esiste giÃ  una scheda coerente. Se il microchip non basta
              o non troviamo nulla, potrai continuare con email e telefono del proprietario
              prima di creare una nuova scheda.
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
          onClick={() =>
            router.push(
              `/professionisti/scansiona/manuale/nuovo?chip=${encodeURIComponent(chip)}`
            )
          }
        >
          âž• Continua con ricerca o nuova scheda
        </button>

        <button
          type="button"
          className="w-full rounded-xl border px-3 py-2 text-sm"
          disabled={!chipLooksValid}
          onClick={() =>
            router.push(
              `/professionisti/scansiona/manuale/associa?chip=${encodeURIComponent(chip)}`
            )
          }
        >
          ðŸ”— Cerca animale esistente con questo microchip
        </button>

        <div className="text-xs opacity-70">
          Se lâ€™animale esiste giÃ , da lÃ¬ potrai aprire la scheda oppure proseguire nel flusso
          corretto in base allo stato owner e agli accessi disponibili.
        </div>
      </div>
    </div>
  );
}
