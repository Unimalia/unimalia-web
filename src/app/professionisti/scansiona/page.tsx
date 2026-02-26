"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import UsbScannerMode from "./UsbScannerMode";
import { normalizeScanResult } from "@/lib/normalizeScanResult";

type Mode = "camera" | "manuale" | "usb";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function tryParseUrl(raw: string) {
  try {
    const withProto =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? raw
        : `https://${raw}`;
    return new URL(withProto);
  } catch {
    return null;
  }
}

function extractAnimalIdFromScan(raw: string): { animalId?: string; error?: string } {
  const code = normalizeScanResult(raw);
  if (!code) return { error: "Codice vuoto" };

  // UUID diretto
  if (isUuid(code)) return { animalId: code };

  // URL QR
  const url = tryParseUrl(code);
  if (url) {
    const path = url.pathname || "";

    const m1 = path.match(/^\/scansiona\/animali\/([^/]+)$/);
    if (m1?.[1]) return { animalId: m1[1] };

    const m2 = path.match(/^\/identita\/([^/]+)$/);
    if (m2?.[1]) return { animalId: m2[1] };

    const m3 = path.match(/^\/professionisti\/animali\/([^/]+)$/);
    if (m3?.[1]) return { animalId: m3[1] };

    return { error: `Link non riconosciuto: ${path}` };
  }

  return { error: "Formato non riconosciuto" };
}

export default function ScannerPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("camera");
  const [manualValue, setManualValue] = useState("");
  const [busy, setBusy] = useState(false);

  const ModeButton = useMemo(
    () =>
      function Btn({ id, label }: { id: Mode; label: string }) {
        const active = mode === id;
        return (
          <button
            type="button"
            className={`rounded-xl border px-3 py-2 text-sm ${
              active ? "font-semibold" : "opacity-80"
            }`}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        );
      },
    [mode]
  );

  async function handleScan(raw: string) {
    if (busy) return;
    setBusy(true);

    try {
      const code = normalizeScanResult(raw);
      if (!code) {
        alert("Codice vuoto");
        return;
      }

      // =========================
      // ✅ MICROCHIP 15 CIFRE
      // =========================
      if (/^\d{15}$/.test(code)) {
        const res = await fetch(
          `/api/animals/find?chip=${encodeURIComponent(code)}`,
          { cache: "no-store" }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.animalId) {
          alert("Microchip non trovato");
          return;
        }

        router.push(
          `/professionisti/animali/${encodeURIComponent(json.animalId)}`
        );
        return;
      }

      // =========================
      // ✅ QR / UUID
      // =========================
      const { animalId, error } = extractAnimalIdFromScan(code);

      if (!animalId) {
        alert(error ?? "Codice non valido");
        return;
      }

      router.push(`/professionisti/animali/${encodeURIComponent(animalId)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Scanner Microchip</h1>
        <div className="text-xs opacity-70">
          {busy ? "elaborazione..." : ""}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <ModeButton id="camera" label="📷 Fotocamera" />
        <ModeButton id="manuale" label="⌨️ Manuale" />
        <ModeButton id="usb" label="🔫 Lettore USB" />
      </div>

      {/* CAMERA */}
      {mode === "camera" && (
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium mb-2">
            📷 Modalità fotocamera
          </div>

          {/* Qui inserisci il tuo componente camera esistente */}
          {/* Esempio:
          <CameraScanner onScan={(value) => handleScan(value)} />
          */}
        </div>
      )}

      {/* MANUALE */}
      {mode === "manuale" && (
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm font-medium">
            ⌨️ Inserimento manuale
          </div>

          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Incolla link QR, UUID o microchip (15 cifre)"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleScan(manualValue);
              }
            }}
          />

          <button
            type="button"
            className="rounded-xl border px-3 py-2"
            disabled={busy}
            onClick={() => void handleScan(manualValue)}
          >
            Apri scheda
          </button>
        </div>
      )}

      {/* USB */}
      {mode === "usb" && (
        <UsbScannerMode onScan={handleScan} />
      )}
    </div>
  );
}