"use client";

import React, { useState } from "react";
import UsbScannerMode from "./UsbScannerMode";
import { normalizeScanResult } from "@/lib/normalizeScanResult";

type Mode = "camera" | "manuale" | "usb";

export default function ScannerPage() {
  const [mode, setMode] = useState<Mode>("camera");

  async function handleScan(raw: string) {
    const code = normalizeScanResult(raw);
    if (!code) return;

    // 🔗 QUI collega la tua logica reale già esistente:
    // esempio:
    // router.push(`/scansiona/animali/${code}`);
    console.log("SCAN:", code);
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">
        Scanner Microchip
      </h1>

      <div className="flex gap-2 flex-wrap">
        <button
          className="rounded-xl border px-3 py-2 text-sm"
          onClick={() => setMode("camera")}
        >
          📷 Fotocamera
        </button>

        <button
          className="rounded-xl border px-3 py-2 text-sm"
          onClick={() => setMode("manuale")}
        >
          ⌨️ Manuale
        </button>

        <button
          className="rounded-xl border px-3 py-2 text-sm"
          onClick={() => setMode("usb")}
        >
          🔫 Lettore USB
        </button>
      </div>

      {mode === "camera" && (
        <div className="rounded-2xl border p-4">
          📷 Modalità fotocamera
          <div className="text-sm opacity-70 mt-2">
            (Collega qui il tuo componente scanner già funzionante)
          </div>
        </div>
      )}

      {mode === "manuale" && (
        <ManualMode onScan={handleScan} />
      )}

      {mode === "usb" && (
        <UsbScannerMode onScan={handleScan} />
      )}
    </div>
  );
}

function ManualMode({ onScan }: { onScan: (code: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="text-sm font-medium">
        Inserimento manuale
      </div>

      <input
        className="w-full rounded-xl border px-3 py-2"
        placeholder="Inserisci codice microchip"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <button
        className="rounded-xl border px-3 py-2"
        onClick={() => onScan(value)}
      >
        Cerca
      </button>
    </div>
  );
}