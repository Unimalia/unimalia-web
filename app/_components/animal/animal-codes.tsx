// components/animal/animal-codes.tsx
"use client";

import React, { useEffect, useMemo, useRef } from "react";
import QRCode from "react-qr-code";
import JsBarcode from "jsbarcode";

type Props = {
  qrValue: string;       // es: unimalia_code o link scheda
  barcodeValue: string;  // es: unimalia_code o chip_number
  label?: string;
};

export function AnimalCodes({ qrValue, barcodeValue, label }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const safeBarcode = useMemo(() => {
    // JsBarcode con CODE128 gestisce bene stringhe alfanumeriche
    return (barcodeValue ?? "").trim();
  }, [barcodeValue]);

  useEffect(() => {
    if (!svgRef.current || !safeBarcode) return;

    try {
      JsBarcode(svgRef.current, safeBarcode, {
        format: "CODE128",
        displayValue: true,
        height: 50,
        margin: 0,
        fontSize: 12,
      });
    } catch {
      // se valore non valido, non esplodiamo la UI
      svgRef.current.innerHTML = "";
    }
  }, [safeBarcode]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">QR Code</p>
        {label ? <p className="mt-1 text-xs text-zinc-500">{label}</p> : null}

        <div className="mt-4 flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <div className="bg-white p-3 rounded-xl border border-zinc-200">
            <QRCode value={qrValue} size={160} />
          </div>
        </div>

        <p className="mt-3 break-all text-xs text-zinc-500">{qrValue}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">Codice a barre</p>
        {label ? <p className="mt-1 text-xs text-zinc-500">{label}</p> : null}

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <svg ref={svgRef} className="w-full" />
        </div>

        <p className="mt-3 break-all text-xs text-zinc-500">{safeBarcode}</p>
      </div>
    </div>
  );
}