// _components/animal/animal-codes.tsx
"use client";

import React, { useEffect, useMemo, useRef } from "react";
import QRCode from "react-qr-code";
import JsBarcode from "jsbarcode";

type Props = {
  qrValue: string;
  barcodeValue: string;
  caption?: string;
};

export function AnimalCodes({ qrValue, barcodeValue, caption }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const safeBarcode = useMemo(() => (barcodeValue ?? "").trim(), [barcodeValue]);

  useEffect(() => {
    if (!svgRef.current) return;

    // reset
    svgRef.current.innerHTML = "";

    if (!safeBarcode) return;

    try {
      JsBarcode(svgRef.current, safeBarcode, {
        format: "CODE128",
        displayValue: true,
        height: 56,
        margin: 0,
        fontSize: 12,
      });
    } catch {
      svgRef.current.innerHTML = "";
    }
  }, [safeBarcode]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">QR Code</p>
        {caption ? <p className="mt-1 text-xs text-zinc-500">{caption}</p> : null}

        <div className="mt-4 flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <QRCode value={qrValue} size={164} />
          </div>
        </div>

        <p className="mt-3 break-all text-xs text-zinc-500">{qrValue}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">Codice a barre</p>
        {caption ? <p className="mt-1 text-xs text-zinc-500">{caption}</p> : null}

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <svg ref={svgRef} className="w-full" />
        </div>

        <p className="mt-3 break-all text-xs text-zinc-500">{safeBarcode || "—"}</p>
      </div>
    </div>
  );
}