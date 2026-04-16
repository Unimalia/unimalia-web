"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UsbScannerMode from "./UsbScannerMode";
import { normalizeScanResult } from "@/lib/normalizeScanResult";
import CameraScanner from "./CameraScanner";
import { isUuid } from "@/lib/server/validators";

type Mode = "camera" | "codice";
type Banner = { kind: "success" | "error" | "info"; text: string } | null;

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

      if (/^unimalia[:\-]/i.test(q)) {
        return { kind: "q", q };
      }

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
  const searchParams = useSearchParams();
  const directValue = (searchParams.get("value") || "").trim();
  const directHandledRef = useRef(false);

  const [mode, setMode] = useState<Mode>("camera");
  const [manualValue, setManualValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  const bannerTimer = useRef<number | null>(null);
  const cameraSectionRef = useRef<HTMLDivElement | null>(null);
  const codeSectionRef = useRef<HTMLDivElement | null>(null);
  const lastScanRef = useRef<{ code: string; ts: number } | null>(null);

  const showBanner = React.useCallback((next: Banner, autoMs = 4000) => {
    setBanner(next);
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    if (next && autoMs > 0) {
      bannerTimer.current = window.setTimeout(() => setBanner(null), autoMs);
    }
  }, []);

  const safePush = React.useCallback(
    (path: string) => {
      if (path === "/professionisti/animali" || path === "/professionisti/animali/") {
        showBanner({
          kind: "error",
          text: "Bloccato: lo scanner deve aprire una scheda animale o la gestione manuale.",
        });
        return;
      }
      router.push(path);
    },
    [router, showBanner]
  );

  function openCameraMode() {
    setMode("camera");
    setTimeout(() => {
      cameraSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function openCodeMode() {
    setMode("codice");
    setTimeout(() => {
      codeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const statusLabel = useMemo(() => {
    if (busy) return "Elaborazione in corso...";
    if (mode === "camera") return "Fotocamera / webcam pronta";
    return "Codice manuale / lettore pronto";
  }, [busy, mode]);

  const logScan = React.useCallback(
    async (payload: {
      raw: string;
      normalized: string;
      outcome: "success" | "not_found" | "invalid";
      animalId?: string | null;
      note?: string | null;
    }) => {
      try {
        await fetch("/api/professionisti/scan-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // best-effort
      }
    },
    []
  );

  const resolveAnimalForProfessional = React.useCallback(async (query: string) => {
    const res = await fetch(
      `/api/professionisti/animals/find?q=${encodeURIComponent(query)}`,
      {
        cache: "no-store",
        headers: {
          "x-unimalia-app": "professionisti",
        },
      }
    );

    const json = await res.json().catch(() => ({}));
    const animalId = String(json?.animal?.id ?? "").trim();

    return {
      ok: res.ok,
      found: Boolean(json?.found && animalId),
      animalId,
      json,
    };
  }, []);

  const routeAfterProfessionalLookup = React.useCallback(
    async (resolvedAnimalId: string, extraParams?: Record<string, string>) => {
      const accessRes = await fetch(
        `/api/professionisti/animal?animalId=${encodeURIComponent(resolvedAnimalId)}`,
        {
          cache: "no-store",
          headers: {
            "x-unimalia-app": "professionisti",
          },
        }
      );

      const accessJson = await accessRes.json().catch(() => ({}));

      if (accessRes.ok) {
        showBanner({ kind: "success", text: "Accesso disponibile. Apro la scheda animaleâ€¦" }, 900);
        safePush(`/professionisti/animali/${encodeURIComponent(resolvedAnimalId)}`);
        return;
      }

      if (accessRes.status === 403) {
        const params = new URLSearchParams({
          animalId: resolvedAnimalId,
          auto: "1",
        });

        if (extraParams) {
          Object.entries(extraParams).forEach(([key, value]) => {
            if (value) params.set(key, value);
          });
        }

        showBanner(
          {
            kind: "info",
            text: "Animale esistente trovato, ma accesso clinico non attivo. Apro richiesta accessoâ€¦",
          },
          1200
        );

        safePush(`/professionisti/richieste-accesso?${params.toString()}`);
        return;
      }

      if (accessRes.status === 404) {
        showBanner(
          {
            kind: "error",
            text: "Animale non trovato.",
          },
          3000
        );
        return;
      }

      showBanner(
        {
          kind: "error",
          text: accessJson?.error || "Errore verifica accesso animale.",
        },
        3000
      );
    },
    [safePush, showBanner]
  );

  const handleScan = React.useCallback(
    async (raw: string) => {
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
      showBanner({ kind: "info", text: "Elaborazione in corsoâ€¦" }, 0);

      try {
        const ex = extractFromScan(normalized);

        if (ex.kind === "chip") {
          const lookup = await resolveAnimalForProfessional(ex.chip);

          if (!lookup.ok) {
            showBanner(
              { kind: "error", text: lookup.json?.error || "Errore lookup animale" },
              2500
            );
            return;
          }

          if (!lookup.found || !lookup.animalId) {
            showBanner(
              { kind: "info", text: "Microchip non trovato. Apro gestione manualeâ€¦" },
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

          showBanner(
            { kind: "success", text: "Animale esistente trovato. Verifico accessoâ€¦" },
            1200
          );

          await routeAfterProfessionalLookup(lookup.animalId, {
            chip: String(ex.chip ?? ""),
          });
          return;
        }

        if (ex.kind === "animalId") {
          showBanner({ kind: "success", text: "Codice riconosciuto. Risolvo animaleâ€¦" }, 1200);

          const lookup = await resolveAnimalForProfessional(String(ex.animalId ?? normalized ?? raw ?? ""));

          if (!lookup.ok) {
            showBanner(
              { kind: "error", text: lookup.json?.error || "Errore lookup animale" },
              2500
            );
            return;
          }

          if (!lookup.found || !lookup.animalId) {
            showBanner(
              {
                kind: "error",
                text: "Animale non trovato. Prova con microchip o codice UNIMALIA valido.",
              },
              3000
            );
            return;
          }

          await routeAfterProfessionalLookup(lookup.animalId);
          return;
        }

        if (ex.kind === "q") {
          showBanner(
            { kind: "success", text: "Codice UNIMALIA riconosciuto. Risolvo animaleâ€¦" },
            1200
          );

          const lookup = await resolveAnimalForProfessional(ex.q);

          if (!lookup.ok) {
            showBanner(
              { kind: "error", text: lookup.json?.error || "Errore lookup animale" },
              2500
            );
            return;
          }

          if (!lookup.found || !lookup.animalId) {
            showBanner(
              {
                kind: "error",
                text: "Animale non trovato. Codice UNIMALIA non valido o non associato.",
              },
              3000
            );
            return;
          }

          await routeAfterProfessionalLookup(lookup.animalId);
          return;
        }

        if (ex.kind === "publicToken") {
          showBanner({ kind: "success", text: "Link UNIMALIA riconosciuto. Aperturaâ€¦" }, 1500);
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
    },
    [busy, logScan, resolveAnimalForProfessional, routeAfterProfessionalLookup, safePush, showBanner]
  );

  useEffect(() => {
    if (!directValue || directHandledRef.current) return;
    directHandledRef.current = true;
    void handleScan(directValue);
  }, [directValue, handleScan]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-500">SCANSIONE</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
              Apri rapidamente una scheda animale
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Usa la fotocamera del telefono, la webcam del computer oppure inserisci il codice
              manualmente. Se hai giÃ  accesso, la scheda si apre subito. Se manca autorizzazione,
              parte la richiesta al proprietario.
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

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openCameraMode}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            Avvia fotocamera / webcam
          </button>

          <button
            type="button"
            onClick={openCodeMode}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
          >
            Inserisci codice / usa lettore
          </button>
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

      <div className="grid gap-3 md:grid-cols-2">
        <ModeButton
          active={mode === "camera"}
          title="Fotocamera / webcam"
          description="La modalitÃ  piÃ¹ rapida per QR UNIMALIA e codici visibili."
          icon="ðŸ“·"
          onClick={openCameraMode}
          disabled={busy}
        />
        <ModeButton
          active={mode === "codice"}
          title="Codice / lettore"
          description="Incolla il codice o usa un lettore USB collegato."
          icon="âŒ¨ï¸"
          onClick={openCodeMode}
          disabled={busy}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">1. Acquisisci codice</div>
          <div className="mt-1 text-xs text-zinc-600">
            QR UNIMALIA, microchip, UUID o codice compatibile.
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">2. Verifica accesso</div>
          <div className="mt-1 text-xs text-zinc-600">
            Se lâ€™animale Ã¨ giÃ  autorizzato, entri subito nella scheda.
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">3. Se manca accesso</div>
          <div className="mt-1 text-xs text-zinc-600">
            Parte la richiesta al proprietario e resti in attesa di conferma.
          </div>
        </div>
      </div>

      {mode === "camera" && (
        <div
          ref={cameraSectionRef}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Fotocamera / webcam</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Punta la fotocamera del telefono o la webcam del computer verso il codice.
            </p>
          </div>

          <CameraScanner onScan={(value) => handleScan(value)} disabled={busy} />

          <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-600">
            Supporta QR UNIMALIA, link compatibili, UUID diretti e microchip da 15 cifre.
          </div>
        </div>
      )}

      {mode === "codice" && (
        <div
          ref={codeSectionRef}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Codice / lettore</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Usa questa area se vuoi incollare un codice manualmente oppure leggere il microchip
              con un lettore USB.
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
          </div>

          <div className="border-t border-zinc-200 pt-5">
            <h3 className="text-sm font-semibold text-zinc-900">Oppure usa il lettore USB</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Se il lettore Ã¨ collegato, acquisisci qui il codice senza cambiare pagina.
            </p>

            <div className="mt-4">
              <UsbScannerMode onScan={handleScan} disabled={busy} />
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-600">
            Se il microchip non viene trovato, si apre la gestione manuale per creare o associare
            lâ€™animale.
          </div>
        </div>
      )}
    </div>
  );
}
