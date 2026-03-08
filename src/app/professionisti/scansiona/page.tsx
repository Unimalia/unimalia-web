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
        error: "Questo codice apre la lista animali, non una singola scheda.",
      };
    }

    if (path === "/scansiona" || path === "/scansiona/") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return { kind: "error", error: "Link /scansiona senza parametro q" };

      if (isUuid(q)) return { kind: "animalId", animalId: q };

      const dq = digitsOnly(q);
      if (dq.length === 15 || dq.length === 10) return { kind: "chip", chip: dq };

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

function ModeButton({
  active,
  title,
  icon,
  onClick,
  disabled,
}: {
  active: boolean;
  title: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-black bg-black text-white"
          : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      <span>{icon}</span>
      <span>{title}</span>
    </button>
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
        text: "Bloccato: questa azione deve aprire una singola scheda animale o una richiesta di accesso.",
      });
      return;
    }
    router.push(path);
  }

  const lastScanRef = useRef<{ code: string; ts: number } | null>(null);

  const statusLabel = useMemo(() => {
    if (busy) return "Elaborazione in corso...";
    if (mode === "camera") return "Fotocamera pronta";
    if (mode === "manuale") return "Inserimento manuale attivo";
    return "Lettore USB pronto";
  }, [busy, mode]);

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
          showBanner(
            { kind: "info", text: "Microchip non trovato. Apro gestione manuale…" },
            1500
          );

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

        showBanner({ kind: "success", text: "Animale trovato. Controllo accesso…" }, 1000);

        const accessRes = await fetch(
          `/api/professionisti/grants/check?animal_id=${encodeURIComponent(resolvedAnimalId)}`,
          { cache: "no-store" }
        );
        const accessJson = await accessRes.json().catch(() => ({}));

        if (!accessRes.ok) {
          showBanner({ kind: "error", text: accessJson?.error || "Errore verifica accesso" }, 2500);
          return;
        }

        const hasAccess = Boolean(accessJson?.ok);

        if (!hasAccess) {
          safePush(
            `/professionisti/richieste-accesso?animalId=${encodeURIComponent(
              resolvedAnimalId
            )}&chip=${encodeURIComponent(String(ex.chip ?? ""))}&auto=1`
          );
          return;
        }

        safePush(`/professionisti/animali/${encodeURIComponent(resolvedAnimalId)}`);
        return;
      }

      if (ex.kind === "animalId") {
        showBanner({ kind: "success", text: "Codice riconosciuto. Risolvo animale…" }, 1000);

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

        showBanner({ kind: "success", text: "Animale trovato. Controllo accesso…" }, 1000);

        const accessRes = await fetch(
          `/api/professionisti/grants/check?animal_id=${encodeURIComponent(resolvedAnimalId)}`,
          { cache: "no-store" }
        );
        const accessJson = await accessRes.json().catch(() => ({}));

        if (!accessRes.ok) {
          showBanner({ kind: "error", text: accessJson?.error || "Errore verifica accesso" }, 2500);
          return;
        }

        const hasAccess = Boolean(accessJson?.ok);

        if (!hasAccess) {
          safePush(
            `/professionisti/richieste-accesso?animalId=${encodeURIComponent(
              resolvedAnimalId
            )}&auto=1`
          );
          return;
        }

        safePush(`/professionisti/animali/${encodeURIComponent(resolvedAnimalId)}`);
        return;
      }

      if (ex.kind === "q") {
        showBanner({ kind: "success", text: "Codice UNIMALIA riconosciuto. Risolvo animale…" }, 1000);

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
            {
              kind: "error",
              text: "Animale non trovato. Codice UNIMALIA non valido o non associato.",
            },
            3000
          );
          return;
        }

        const accessRes = await fetch(
          `/api/professionisti/grants/check?animal_id=${encodeURIComponent(resolvedAnimalId)}`,
          { cache: "no-store" }
        );
        const accessJson = await accessRes.json().catch(() => ({}));

        if (!accessRes.ok) {
          showBanner({ kind: "error", text: accessJson?.error || "Errore verifica accesso" }, 2500);
          return;
        }

        const hasAccess = Boolean(accessJson?.ok);

        if (!hasAccess) {
          safePush(
            `/professionisti/richieste-accesso?animalId=${encodeURIComponent(
              resolvedAnimalId
            )}&auto=1`
          );
          return;
        }

        safePush(`/professionisti/animali/${encodeURIComponent(resolvedAnimalId)}`);
        return;
      }

      if (ex.kind === "publicToken") {
        showBanner({ kind: "success", text: "Link UNIMALIA riconosciuto. Apertura…" }, 1200);

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
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-500">SCANSIONE</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Apri una scheda animale</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Scansiona un QR UNIMALIA, un microchip oppure inserisci manualmente un codice.
              Se l’animale è già autorizzato si apre subito. Se manca autorizzazione, la richiesta parte automaticamente.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <div className="font-medium text-zinc-900">Stato</div>
            <div className="mt-1 flex items-center gap-2">
              {busy ? (
                <Spinner />
              ) : (
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              )}
              <span>{statusLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            banner.kind === "error"
              ? "border-red-200 bg-red-50"
              : banner.kind === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-zinc-200 bg-white"
          }`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-zinc-800">
              <span className="font-semibold">
                {banner.kind === "error"
                  ? "Errore"
                  : banner.kind === "success"
                    ? "Operazione riuscita"
                    : "Informazione"}
                :
              </span>{" "}
              {banner.text}
            </div>

            <button
              type="button"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              onClick={() => setBanner(null)}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <ModeButton
            active={mode === "camera"}
            title="Fotocamera"
            icon="📷"
            onClick={() => setMode("camera")}
            disabled={busy}
          />
          <ModeButton
            active={mode === "manuale"}
            title="Manuale"
            icon="⌨️"
            onClick={() => setMode("manuale")}
            disabled={busy}
          />
          <ModeButton
            active={mode === "usb"}
            title="Lettore USB"
            icon="🔫"
            onClick={() => setMode("usb")}
            disabled={busy}
          />
        </div>
      </div>

      {mode === "camera" && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Fotocamera</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Inquadra un QR UNIMALIA o un codice compatibile.
            </p>
          </div>

          <CameraScanner onScan={(value) => handleScan(value)} disabled={busy} />

          <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-600">
            Supporta QR UNIMALIA, UUID diretto e microchip da 15 cifre. Sono accettati anche codici da 10 cifre se previsti nel tuo flusso operativo.
          </div>
        </div>
      )}

      {mode === "manuale" && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Inserimento manuale</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Incolla un link QR, un microchip, un UUID o un codice UNIMALIA.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900">Codice o link</label>
              <input
                className="mt-1 w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
                placeholder="Es. UNIMALIA:XXXX, 380260101234567, link QR..."
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
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                disabled={busy || !manualValue.trim()}
                onClick={() => void handleScan(manualValue)}
              >
                {busy ? <Spinner /> : null}
                <span>Apri o richiedi accesso</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                disabled={busy}
                onClick={() => setManualValue("")}
              >
                Pulisci
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "usb" && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Lettore USB</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Usa il lettore collegato per acquisire rapidamente il microchip.
            </p>
          </div>

          <UsbScannerMode onScan={handleScan} disabled={busy} />
        </div>
      )}

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-zinc-500">FLUSSO</p>

        <div className="mt-3 space-y-2 text-sm text-zinc-700">
          <div className="rounded-2xl bg-zinc-50 px-4 py-3">
            1. Scansioni o incolli il codice dell’animale.
          </div>
          <div className="rounded-2xl bg-zinc-50 px-4 py-3">
            2. Se hai già accesso, la scheda si apre subito.
          </div>
          <div className="rounded-2xl bg-zinc-50 px-4 py-3">
            3. Se non hai ancora accesso, la richiesta parte automaticamente e il proprietario può approvarla.
          </div>
        </div>
      </div>
    </div>
  );
}