"use client";

import React, { useEffect, useMemo, useRef } from "react";
import QRCode from "react-qr-code";
import JsBarcode from "jsbarcode";

type Props = {
  qrValue: string;
  barcodeValue: string;
  caption?: string;
  layout?: "grid" | "stack";
};

export function AnimalCodes({ qrValue, barcodeValue, caption, layout = "grid" }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const safeBarcode = useMemo(() => (barcodeValue ?? "").trim(), [barcodeValue]);

  useEffect(() => {
    if (!svgRef.current) return;

    // reset (pulito su SVG)
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }

    if (!safeBarcode) return;

    try {
      JsBarcode(svgRef.current, safeBarcode, {
        format: "CODE128",
        displayValue: true,
        height: layout === "stack" ? 90 : 56,
        margin: 0,
        fontSize: 12,
      });
    } catch {
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }
    }
  }, [safeBarcode, layout]);

  const wrapperClass =
    layout === "stack" ? "flex flex-col gap-4" : "grid gap-4 md:grid-cols-2";

  return (
    <div className="space-y-3">
      <div className={wrapperClass}>
        {qrValue ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">QR Code</p>

            <div className="mt-4 flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-3">
                <QRCode value={qrValue} size={164} />
              </div>
            </div>

            <p className="mt-3 break-all text-xs text-zinc-500">{qrValue}</p>
          </div>
        ) : null}

        {barcodeValue ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">Codice a barre</p>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <svg ref={svgRef} className="w-full" />
            </div>

            <p className="mt-3 break-all text-xs text-zinc-500">{safeBarcode}</p>
          </div>
        ) : null}
      </div>

      {caption ? <div className="text-xs text-zinc-500">{caption}</div> : null}
    </div>
  );
}