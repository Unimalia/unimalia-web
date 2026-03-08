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

function ModeCard({
  active,
  title,
  description,
  icon,
  onClick,
  disabled,
}: {
  active: boolean;
  title: string;
  description: string;
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
        "w-full rounded-2xl border p-4 text-left transition",
        active
          ? "border-black bg-black text-white"
          : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50",
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl">{icon}</div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className={active ? "mt-1 text-xs text-white/80" : "mt-1 text-xs text-zinc-500"}>
            {description}
          </div>
        </div>
      </div>
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
        text: "Bloccato: lo scanner deve aprire una scheda animale o la gestione manuale.",
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

        showBanner({ kind: "success", text: "Animale trovato. Controllo accesso…" }, 1200);

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

        showBanner({ kind: "success", text: "Animale trovato. Controllo accesso…" }, 1200);

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
            {
              kind: "error",
              text: "Animale non trovato. Codice UNIMALIA non valido o non associato.",
            },
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-500">SCANSIONE</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Apri rapidamente una scheda animale</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Scansiona un QR UNIMALIA, leggi un microchip oppure inserisci manualmente un codice.
              Se l’animale è già autorizzato lo apri subito, altrimenti verrai portato alla richiesta di accesso.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <div className="font-medium text-zinc-900">Stato</div>
            <div className="mt-1 flex items-center gap-2">
              {busy ? <Spinner /> : <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />}
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

      <div className="grid gap-3 md:grid-cols-3">
        <ModeCard
          active={mode === "camera"}
          title="Fotocamera"
          description="Scansiona QR UNIMALIA e codici direttamente dalla camera."
          icon="📷"
          onClick={() => setMode("camera")}
          disabled={busy}
        />
        <ModeCard
          active={mode === "manuale"}
          title="Inserimento manuale"
          description="Incolla un link, un microchip o un codice UNIMALIA."
          icon="⌨️"
          onClick={() => setMode("manuale")}
          disabled={busy}
        />
        <ModeCard
          active={mode === "usb"}
          title="Lettore USB"
          description="Usa un lettore esterno per scansione rapida in ambulatorio."
          icon="🔫"
          onClick={() => setMode("usb")}
          disabled={busy}
        />
      </div>

      {mode === "camera" && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Modalità fotocamera</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Punta la fotocamera verso un QR UNIMALIA o un codice compatibile.
            </p>
          </div>

          <CameraScanner onScan={(value) => handleScan(value)} disabled={busy} />

          <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-600">
            Supporta QR UNIMALIA, UUID diretto e microchip da 15 cifre. Sono accettati anche codici da
            10 cifre se previsti nel tuo flusso operativo.
          </div>
        </div>
      )}

      {mode === "manuale" && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
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
                <span>Apri scheda animale</span>
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

            <div className="rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-600">
              Se il microchip non viene trovato, si apre la gestione manuale per creare o associare
              l’animale.
            </div>
          </div>
        </div>
      )}

      {mode === "usb" && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Lettore USB</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Usa il lettore collegato per acquisire rapidamente il codice del microchip.
            </p>
          </div>

          <UsbScannerMode onScan={handleScan} disabled={busy} />
        </div>
      )}

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-zinc-500">COME FUNZIONA</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-900">1. Scansiona o incolla</div>
            <div className="mt-1 text-xs text-zinc-600">
              QR UNIMALIA, microchip, UUID o link compatibile.
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-900">2. Controllo accesso</div>
            <div className="mt-1 text-xs text-zinc-600">
              Se hai già accesso all’animale, la scheda si apre subito.
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-900">3. Se manca accesso</div>
            <div className="mt-1 text-xs text-zinc-600">
              Vieni portato alla richiesta di accesso o alla gestione manuale.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}