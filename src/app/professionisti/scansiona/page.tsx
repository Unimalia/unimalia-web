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
  | { kind: "q"; q: string }
  | { kind: "error"; error: string };

function extractFromScan(raw: string): Extract {
  const code = normalizeScanResult(raw);
  if (!code) return { kind: "error", error: "Codice vuoto" };

  if (isUuid(code)) return { kind: "animalId", animalId: code };

  // ✅ Supporta codici testuali UNIMALIA:xxxx / UNIMALIA-xxxx
  // (li risolveremo via /api/animals/find?q=...)
  if (/^unimalia[:\-]/i.test(code)) {
    return { kind: "q", q: code };
  }

  const d = digitsOnly(code);

  if (d.length === 13) {
    return {
      kind: "error",
      error: "Questo sembra un barcode (13 cifre), non un microchip UNIMALIA.",
    };
  }

  if (d.length === 15 || d.length === 10) {
    return { kind: "chip", chip: d };
  }

  const url = tryParseUrl(code);
  if (url) {
    const path = url.pathname || "";

    if (path === "/professionisti/animali" || path === "/professionisti/animali/") {
      return {
        kind: "error",
        error: "Questo codice apre la lista animali (non è un animale). Usa QR UNIMALIA o microchip.",
      };
    }

    // ✅ QR universale: /scansiona?q=...
    // Esempio: https://unimalia.it/scansiona?q=UNIMALIA:xxxx oppure q=380...
    if (path === "/scansiona" || path === "/scansiona/") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return { kind: "error", error: "Link /scansiona senza parametro q" };

      // Se q contiene un UUID puro, ok.
      if (isUuid(q)) return { kind: "animalId", animalId: q };

      // Se q è un microchip (numeri), ok.
      const dq = digitsOnly(q);
      if (dq.length === 15 || dq.length === 10) return { kind: "chip", chip: dq };

      // Altrimenti (es: UNIMALIA:xxxx) lo trattiamo come “codice animale”
      // e verrà risolto in handleScan tramite /api/animals/find?q=...
      return { kind: "animalId", animalId: q };
    }

    const qAnimalId = url.searchParams.get("animalId") || url.searchParams.get("id");
    if (qAnimalId && isUuid(qAnimalId)) return { kind: "animalId", animalId: qAnimalId };

    const mProVerify = path.match(/^\/professionisti\/animali\/([^/]+)\/verifica\/?$/);
    if (mProVerify?.[1]) return { kind: "animalId", animalId: mProVerify[1] };

    const mPro = path.match(/^\/professionisti\/animali\/([^/]+)\/?$/);
    if (mPro?.[1]) return { kind: "animalId", animalId: mPro[1] };

    const mId = path.match(/^\/identita\/([^/]+)\/?$/);
    if (mId?.[1]) return { kind: "animalId", animalId: mId[1] };

    const mScan = path.match(/^\/scansiona\/animali\/([^/]+)\/?$/);
    if (mScan?.[1]) return { kind: "animalId", animalId: mScan[1] };

    const mA = path.match(/^\/a\/([^/]+)\/?$/);
    if (mA?.[1]) return { kind: "publicToken", token: mA[1] };

    const qChip = url.searchParams.get("chip");
    if (qChip) {
      const dc = digitsOnly(qChip);

      if (dc.length === 13) {
        return {
          kind: "error",
          error: "Questo sembra un barcode (13 cifre), non un microchip UNIMALIA.",
        };
      }

      if (dc.length === 15 || dc.length === 10) return { kind: "chip", chip: dc };
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

  const bannerTimer = useRef<number | null>(null);
  function showBanner(next: Banner, autoMs = 4000) {
    setBanner(next);
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    if (next && autoMs > 0) {
      bannerTimer.current = window.setTimeout(() => setBanner(null), autoMs);
    }
  }

  function safePush(path: string) {
    if (path === "/professionisti/animali" || path === "/professionisti/animali/") {
      showBanner({
        kind: "error",
        text: "Bloccato: navigazione alla lista Animali (placeholder). Lo scanner deve aprire solo una scheda o la gestione manuale.",
      });
      return;
    }
    router.push(path);
  }

  const lastScanRef = useRef<{ code: string; ts: number } | null>(null);

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

      if (ex.kind === "chip") {
        const res = await fetch(`/api/animals/find?q=${encodeURIComponent(ex.chip)}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));

        const resolvedAnimalId = String(json?.animal?.id ?? "").trim();

        if (!res.ok || !json?.found || !resolvedAnimalId) {
          showBanner({ kind: "info", text: "Microchip non trovato. Apro gestione manuale…" }, 1500);

          void logScan({
            raw,
            normalized,
            outcome: "not_found",
            animalId: null,
            note: "chip lookup not found -> manual",
          });
          safePush(`/professionisti/scansiona/manuale?value=${encodeURIComponent(ex.chip)}`);
          return;
        }

        showBanner({ kind: "success", text: "Animale trovato. Verifico accesso…" }, 1200);

        const grantRes = await fetch(
          `/api/professionisti/grants/check?animal_id=${encodeURIComponent(resolvedAnimalId)}`,
          { cache: "no-store" }
        );
        const grantJson = await grantRes.json().catch(() => ({}));

        if (!grantRes.ok) {
          showBanner({ kind: "error", text: grantJson?.error || "Errore verifica accesso" }, 2500);
          return;
        }

        const hasGrant = Boolean(grantJson?.ok);

        if (!hasGrant) {
          safePush(
            `/professionisti/richieste-accesso?animalId=${encodeURIComponent(
              resolvedAnimalId
            )}&chip=${encodeURIComponent(String(ex.chip ?? ""))}`
          );
          return;
        }

        safePush(`/professionisti/animali/${encodeURIComponent(resolvedAnimalId)}`);
        return;
      }

      if (ex.kind === "animalId") {
        showBanner({ kind: "success", text: "Codice riconosciuto. Risolvo animale…" }, 1200);

        // ✅ Risolvi sempre il codice in un vero animals.id (supporta UNIMALIA:..., chip, id)
        const findRes = await fetch(
          `/api/animals/find?q=${encodeURIComponent(String(ex.animalId ?? normalized ?? raw ?? ""))}`,
          { cache: "no-store" }
        );
        const findJson = await findRes.json().catch(() => ({}));

        if (!findRes.ok) {
          showBanner({ kind: "error", text: findJson?.error || "Errore lookup animale" }, 2500);
          return;
        }

        const resolvedAnimalId = String(findJson?.animal?.id ?? "").trim();
        if (!findJson?.found || !resolvedAnimalId) {
          showBanner(
            {
              kind: "error",
              text: "Animale non trovato. Prova con microchip o codice UNIMALIA valido.",
            },
            3000
          );
          return;
        }

        showBanner({ kind: "success", text: "Animale trovato. Verifico accesso…" }, 1200);

        const grantRes = await fetch(
          `/api/professionisti/grants/check?animal_id=${encodeURIComponent(resolvedAnimalId)}`,
          { cache: "no-store" }
        );
        const grantJson = await grantRes.json().catch(() => ({}));

        if (!grantRes.ok) {
          showBanner({ kind: "error", text: grantJson?.error || "Errore verifica accesso" }, 2500);
          return;
        }

        const hasGrant = Boolean(grantJson?.ok);

        if (!hasGrant) {
          safePush(
            `/professionisti/richieste-accesso?animalId=${encodeURIComponent(resolvedAnimalId)}`
          );
          return;
        }

        safePush(`/professionisti/animali/${encodeURIComponent(resolvedAnimalId)}`);
        return;
      }

      if (ex.kind === "q") {
        showBanner({ kind: "success", text: "Codice UNIMALIA riconosciuto. Risolvo animale…" }, 1200);

        const findRes = await fetch(`/api/animals/find?q=${encodeURIComponent(ex.q)}`, {
          cache: "no-store",
        });
        const findJson = await findRes.json().catch(() => ({}));

        if (!findRes.ok) {
          showBanner({ kind: "error", text: findJson?.error || "Errore lookup animale" }, 2500);
          return;
        }

        const resolvedAnimalId = String(findJson?.animal?.id ?? "").trim();
        if (!findJson?.found || !resolvedAnimalId) {
          showBanner(
            { kind: "error", text: "Animale non trovato. Codice UNIMALIA non valido o non associato." },
            3000
          );
          return;
        }

        const grantRes = await fetch(
          `/api/professionisti/grants/check?animal_id=${encodeURIComponent(resolvedAnimalId)}`,
          { cache: "no-store" }
        );
        const grantJson = await grantRes.json().catch(() => ({}));

        if (!grantRes.ok) {
          showBanner({ kind: "error", text: grantJson?.error || "Errore verifica accesso" }, 2500);
          return;
        }

        const hasGrant = Boolean(grantJson?.ok);

        if (!hasGrant) {
          safePush(`/professionisti/richieste-accesso?animalId=${encodeURIComponent(resolvedAnimalId)}`);
          return;
        }

        safePush(`/professionisti/animali/${encodeURIComponent(resolvedAnimalId)}`);
        return;
      }

      if (ex.kind === "publicToken") {
        showBanner({ kind: "success", text: "Link UNIMALIA riconosciuto. Apertura…" }, 1500);
        void logScan({
          raw,
          normalized,
          outcome: "success",
          animalId: null,
          note: `public token: ${ex.token}`,
        });

        safePush(`/a/${encodeURIComponent(ex.token)}`);
        return;
      }

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

      {mode === "camera" && (
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium mb-2">📷 Modalità fotocamera</div>
          <CameraScanner onScan={(value) => handleScan(value)} disabled={busy} />
          <div className="text-xs opacity-70">
            Supporta QR UNIMALIA (link), UUID diretto o microchip (15 cifre; opzionale 10 cifre).
          </div>
        </div>
      )}

      {mode === "manuale" && (
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm font-medium">⌨️ Inserimento manuale</div>

          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Incolla link QR, UUID o microchip (15 cifre; opzionale 10 cifre)"
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
            Se il microchip non esiste, si apre la gestione manuale per creare/associare.
          </div>
        </div>
      )}

      {mode === "usb" && <UsbScannerMode onScan={handleScan} disabled={busy} />}
    </div>
  );
}