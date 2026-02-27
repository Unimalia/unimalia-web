"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UsbScannerMode from "./UsbScannerMode";
import { normalizeScanResult } from "@/lib/normalizeScanResult";
import CameraScanner from "./CameraScanner";

type Mode = "camera" | "manuale" | "usb";
type Banner = { kind: "success" | "error" | "info"; text: string } | null;

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// Estrae solo cifre (utile per microchip incollati "sporchi")
function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

function tryParseUrl(raw: string) {
  try {
    const withProto =
      raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    return new URL(withProto);
  } catch {
    return null;
  }
}

type Extract =
  | { kind: "animalId"; animalId: string }
  | { kind: "publicToken"; token: string }
  | { kind: "chip"; chip: string }
  | { kind: "error"; error: string };

function extractFromScan(raw: string): Extract {
  const code = normalizeScanResult(raw);
  if (!code) return { kind: "error", error: "Codice vuoto" };

  // 1) UUID diretto
  if (isUuid(code)) return { kind: "animalId", animalId: code };

  // 2) Microchip: tolleriamo input sporchi e lunghezze 10-20 (tipico 15)
  const d = digitsOnly(code);
  if (d.length >= 10 && d.length <= 20) {
    return { kind: "chip", chip: d };
  }

  // 3) URL: riconosci più formati (anche query)
  const url = tryParseUrl(code);
  if (url) {
    const path = url.pathname || "";

    // query param utili
    const qAnimalId = url.searchParams.get("animalId") || url.searchParams.get("id");
    if (qAnimalId && isUuid(qAnimalId)) return { kind: "animalId", animalId: qAnimalId };

    // /professionisti/animali/<id>/verifica
    const mProVerify = path.match(/^\/professionisti\/animali\/([^/]+)\/verifica\/?$/);
    if (mProVerify?.[1]) return { kind: "animalId", animalId: mProVerify[1] };

    // /professionisti/animali/<id>
    const mPro = path.match(/^\/professionisti\/animali\/([^/]+)\/?$/);
    if (mPro?.[1]) return { kind: "animalId", animalId: mPro[1] };

    // /identita/<id>
    const mId = path.match(/^\/identita\/([^/]+)\/?$/);
    if (mId?.[1]) return { kind: "animalId", animalId: mId[1] };

    // /scansiona/animali/<id>
    const mScan = path.match(/^\/scansiona\/animali\/([^/]+)\/?$/);
    if (mScan?.[1]) return { kind: "animalId", animalId: mScan[1] };

    // /a/<token>  (link pubblico UNIMALIA)
    const mA = path.match(/^\/a\/([^/]+)\/?$/);
    if (mA?.[1]) return { kind: "publicToken", token: mA[1] };

    // se è un URL che contiene un microchip in query (?chip=)
    const qChip = url.searchParams.get("chip");
    if (qChip) {
      const dc = digitsOnly(qChip);
      if (dc.length >= 10 && dc.length <= 20) return { kind: "chip", chip: dc };
    }

    return { kind: "error", error: `Link non riconosciuto: ${path}` };
  }

  return { kind: "error", error: "Formato non riconosciuto" };
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-label="loading"
    />
  );
}

export default function ScannerPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("camera");
  const [manualValue, setManualValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  // blocco doppio scan (stesso codice entro 1200ms)
  const lastScanRef = useRef<{ code: string; ts: number } | null>(null);

  const bannerTimer = useRef<number | null>(null);
  function showBanner(next: Banner, autoMs = 4000) {
    setBanner(next);
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    if (next && autoMs > 0) {
      bannerTimer.current = window.setTimeout(() => setBanner(null), autoMs);
    }
  }

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
            disabled={busy}
          >
            {label}
          </button>
        );
      },
    [mode, busy]
  );

  async function logScan(payload: {
    raw: string;
    normalized: string;
    outcome: "success" | "not_found" | "invalid";
    animalId?: string | null;
    note?: string | null;
  }) {
    try {
      await fetch("/api/professionisti/scan-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // best-effort
    }
  }

  async function handleScan(raw: string) {
    const normalized = normalizeScanResult(raw);

    if (!normalized) {
      showBanner({ kind: "error", text: "Codice vuoto." });
      void logScan({ raw, normalized, outcome: "invalid", animalId: null, note: "empty" });
      return;
    }

    // blocco doppio scan
    const now = Date.now();
    const last = lastScanRef.current;
    if (last && last.code === normalized && now - last.ts < 1200) {
      showBanner({ kind: "info", text: "Scansione duplicata ignorata." }, 1500);
      return;
    }
    lastScanRef.current = { code: normalized, ts: now };

    if (busy) return;
    setBusy(true);
    showBanner({ kind: "info", text: "Elaborazione in corso…" }, 0);

    try {
      const ex = extractFromScan(normalized);

      // ✅ microchip -> lookup su animals.chip_number
      if (ex.kind === "chip") {
        const res = await fetch(`/api/animals/find?chip=${encodeURIComponent(ex.chip)}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.animalId) {
          showBanner({ kind: "error", text: "Microchip non trovato." });
          void logScan({
            raw,
            normalized,
            outcome: "not_found",
            animalId: null,
            note: "chip lookup not found",
          });
          return;
        }

        showBanner({ kind: "success", text: "Animale trovato. Apertura scheda…" }, 1500);
        void logScan({
          raw,
          normalized,
          outcome: "success",
          animalId: json.animalId,
          note: "chip lookup ok",
        });

        router.push(`/professionisti/animali/${encodeURIComponent(json.animalId)}`);
        return;
      }

      // ✅ uuid/id -> scheda pro
      if (ex.kind === "animalId") {
        showBanner({ kind: "success", text: "Codice riconosciuto. Apertura scheda…" }, 1500);
        void logScan({
          raw,
          normalized,
          outcome: "success",
          animalId: ex.animalId,
          note: "uuid/url id ok",
        });

        router.push(`/professionisti/animali/${encodeURIComponent(ex.animalId)}`);
        return;
      }

      // ✅ link pubblico /a/<token> -> fallback sicuro (non placeholder)
      if (ex.kind === "publicToken") {
        showBanner({ kind: "success", text: "Link UNIMALIA riconosciuto. Apertura…" }, 1500);
        void logScan({
          raw,
          normalized,
          outcome: "success",
          animalId: null,
          note: `public token: ${ex.token}`,
        });

        router.push(`/a/${encodeURIComponent(ex.token)}`);
        return;
      }

      // errore
      showBanner({ kind: "error", text: ex.error ?? "Codice non valido." });
      void logScan({
        raw,
        normalized,
        outcome: "invalid",
        animalId: null,
        note: ex.error ?? "unrecognized",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Scanner Microchip</h1>
        <div className="text-xs opacity-70 flex items-center gap-2">
          {busy ? (
            <>
              <Spinner />
              <span>elaborazione...</span>
            </>
          ) : null}
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-2xl border p-3 flex items-start justify-between gap-3 ${
            banner.kind === "error"
              ? "bg-red-50"
              : banner.kind === "success"
              ? "bg-green-50"
              : "bg-zinc-50"
          }`}
          role="status"
        >
          <div className="text-sm">
            <span className="font-medium">
              {banner.kind === "error" ? "Errore: " : banner.kind === "success" ? "OK: " : ""}
            </span>
            {banner.text}
          </div>
          <button
            type="button"
            className="rounded-xl border px-2 py-1 text-xs"
            onClick={() => setBanner(null)}
          >
            Chiudi
          </button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <ModeButton id="camera" label="📷 Fotocamera" />
        <ModeButton id="manuale" label="⌨️ Manuale" />
        <ModeButton id="usb" label="🔫 Lettore USB" />
      </div>

      {/* CAMERA */}
      {mode === "camera" && (
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium mb-2">📷 Modalità fotocamera</div>

          <CameraScanner onScan={(value) => handleScan(value)} disabled={busy} />

          <div className="text-xs opacity-70">
            Supporta QR UNIMALIA (link), UUID diretto o microchip (anche incollato “sporco”).
          </div>
        </div>
      )}

      {/* MANUALE */}
      {mode === "manuale" && (
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm font-medium">⌨️ Inserimento manuale</div>

          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Incolla link QR, UUID o microchip (anche con spazi/prefissi)"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleScan(manualValue);
              }
            }}
          />

          <button
            type="button"
            className="rounded-xl border px-3 py-2 inline-flex items-center gap-2"
            disabled={busy || !manualValue.trim()}
            onClick={() => void handleScan(manualValue)}
          >
            {busy ? <Spinner /> : null}
            <span>Apri scheda</span>
          </button>

          <div className="text-xs opacity-70">
            Suggerimento: puoi incollare anche “microchip: 380260123456789” o con spazi: verrà normalizzato.
          </div>
        </div>
      )}

      {/* USB */}
      {mode === "usb" && <UsbScannerMode onScan={handleScan} disabled={busy} />}
    </div>
  );
}