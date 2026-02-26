"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import UsbScannerMode from "./UsbScannerMode";
import { normalizeScanResult } from "@/lib/normalizeScanResult";

type Mode = "camera" | "manuale" | "usb";

function isUuid(v: string) {
  // UUID v4/v1 generic
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function tryParseUrl(raw: string) {
  try {
    // supporta anche scansioni senza protocollo (es. unimalia.it/scansiona/..)
    const withProto =
      raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    return new URL(withProto);
  } catch {
    return null;
  }
}

function extractAnimalIdFromScan(raw: string): { animalId?: string; error?: string } {
  const code = normalizeScanResult(raw);
  if (!code) return { error: "Codice vuoto" };

  // Caso 1: è già un UUID (molte volte il QR può contenere direttamente l'id)
  if (isUuid(code)) return { animalId: code };

  // Caso 2: è un URL (o simile). Proviamo a estrarre path e capire.
  const url = tryParseUrl(code);
  if (url) {
    const path = url.pathname || "";

    // Se è un link pubblico tipo /scansiona/animali/<id>
    const m1 = path.match(/^\/scansiona\/animali\/([^/]+)$/);
    if (m1?.[1]) return { animalId: m1[1] };

    // Se fosse /identita/<id> (se in futuro vuoi reindirizzare uguale)
    const m2 = path.match(/^\/identita\/([^/]+)$/);
    if (m2?.[1]) return { animalId: m2[1] };

    // Se fosse già un link professionisti /professionisti/animali/<id>
    const m3 = path.match(/^\/professionisti\/animali\/([^/]+)$/);
    if (m3?.[1]) return { animalId: m3[1] };

    return {
      error:
        `Link non riconosciuto: ${path}. ` +
        `Atteso /scansiona/animali/<id> oppure un UUID.`,
    };
  }

  // Caso 3: non è URL e non è UUID -> potrebbe essere microchip numerico.
  // Senza una API di lookup chip->animalId non possiamo risolverlo qui.
  // (Se vuoi, prossimo step: aggiungiamo /api/animals/find?chip=...).
  return {
    error:
      "Formato non riconosciuto. Scansiona un QR UNIMALIA (link) oppure incolla l’ID animale (UUID).",
  };
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
      const { animalId, error } = extractAnimalIdFromScan(raw);

      if (!animalId) {
        alert(error ?? "Codice non valido");
        return;
      }

      // ✅ qui apriamo la scheda professionisti
      router.push(`/professionisti/animali/${encodeURIComponent(animalId)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Scanner Microchip</h1>
        <div className="text-xs opacity-70">{busy ? "elaborazione..." : ""}</div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <ModeButton id="camera" label="📷 Fotocamera" />
        <ModeButton id="manuale" label="⌨️ Manuale" />
        <ModeButton id="usb" label="🔫 Lettore USB" />
      </div>

      {mode === "camera" && (
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-sm font-medium">📷 Modalità fotocamera</div>
          <div className="text-sm opacity-70">
            Collega qui il tuo componente scanner già esistente e chiamalo così:
          </div>
          <pre className="rounded-xl bg-zinc-100 p-3 text-xs overflow-auto">
{`// esempio:
<MyCameraScanner onScan={(value) => handleScan(value)} />`}
          </pre>
        </div>
      )}

      {mode === "manuale" && (
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm font-medium">⌨️ Inserimento manuale</div>

          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Incolla link QR (es. .../scansiona/animali/<id>) oppure UUID"
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

          <div className="text-xs opacity-70">
            Tip: se scansionate un QR UNIMALIA, spesso arriva un link completo: lo gestiamo automaticamente.
          </div>
        </div>
      )}

      {mode === "usb" && <UsbScannerMode onScan={handleScan} />}
    </div>
  );
}