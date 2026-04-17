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
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.08)]">
          <div className="border-b border-[#e3e9f0] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                  Scansione manuale
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#30486f]">
                  Gestione manuale microchip
                </h1>

                <p className="mt-4 text-sm leading-7 text-[#5f708a] sm:text-base">
                  Qui normalizzi il valore letto e scegli il flusso corretto prima di aprire,
                  associare o creare una scheda animale.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                onClick={() => router.push("/professionisti/scansiona")}
              >
                ← Torna allo scanner
              </button>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                  Valore letto
                </div>
                <div className="mt-3 rounded-[1rem] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm break-all text-[#30486f]">
                  {rawValue ? rawValue : "—"}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                  Microchip normalizzato
                </div>
                <div className="mt-3 rounded-[1rem] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm break-all font-semibold text-[#30486f]">
                  {chipDigits ? chipDigits : "—"}
                </div>
              </div>

              {!chipLooksValid ? (
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
                  <div className="text-sm font-semibold text-amber-900">Attenzione</div>
                  <p className="mt-2 text-sm leading-7 text-amber-800">
                    Questo valore non sembra un microchip valido. In genere ci aspettiamo
                    <strong> 15 cifre</strong>, oppure in alcuni casi <strong>10 cifre</strong>.
                  </p>
                  <p className="mt-2 text-sm leading-7 text-amber-800">
                    Se hai scansionato un barcode da 13 cifre o un QR non UNIMALIA, torna indietro e riprova.
                  </p>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-[#f8fbff] p-5">
                  <div className="text-sm font-semibold text-[#30486f]">Nuovo flusso</div>
                  <p className="mt-2 text-sm leading-7 text-[#5f708a]">
                    Prima verifichiamo se esiste già una scheda coerente. Se il microchip non basta
                    o non troviamo nulla, potrai continuare con email e telefono del proprietario
                    prima di creare una nuova scheda.
                  </p>
                </div>
              )}

              <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                  Azioni disponibili
                </div>

                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!chipLooksValid}
                    onClick={() =>
                      router.push(
                        `/professionisti/scansiona/manuale/nuovo?chip=${encodeURIComponent(chip)}`
                      )
                    }
                  >
                    ➕ Continua con ricerca o nuova scheda
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-[1rem] bg-[#30486f] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!chipLooksValid}
                    onClick={() =>
                      router.push(
                        `/professionisti/scansiona/manuale/associa?chip=${encodeURIComponent(chip)}`
                      )
                    }
                  >
                    🔗 Cerca animale esistente con questo microchip
                  </button>
                </div>

                <p className="mt-4 text-xs leading-6 text-[#6f7d91]">
                  Se l’animale esiste già, da lì potrai aprire la scheda oppure proseguire nel flusso
                  corretto in base allo stato owner e agli accessi disponibili.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}