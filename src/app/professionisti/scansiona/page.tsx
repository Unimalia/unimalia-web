"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
        "w-full rounded-[1.5rem] border p-4 text-left transition",
        active
          ? "border-[#30486f] bg-[#30486f] text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)]"
          : "border-[#d7dfe9] bg-white text-[#30486f] hover:border-[#cbd7e4] hover:bg-[#f8fbff]",
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl">{icon}</div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className={active ? "mt-1 text-xs text-white/80" : "mt-1 text-xs text-[#6f7d91]"}>
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
        showBanner({ kind: "success", text: "Accesso disponibile. Apro la scheda animale…" }, 900);
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
            text: "Animale esistente trovato, ma accesso clinico non attivo. Apro richiesta accesso…",
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
      showBanner({ kind: "info", text: "Elaborazione in corso…" }, 0);

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

          showBanner(
            { kind: "success", text: "Animale esistente trovato. Verifico accesso…" },
            1200
          );

          await routeAfterProfessionalLookup(lookup.animalId, {
            chip: String(ex.chip ?? ""),
          });
          return;
        }

        if (ex.kind === "animalId") {
          showBanner({ kind: "success", text: "Codice riconosciuto. Risolvo animale…" }, 1200);

          const lookup = await resolveAnimalForProfessional(
            String(ex.animalId ?? normalized ?? raw ?? "")
          );

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
            { kind: "success", text: "Codice UNIMALIA riconosciuto. Risolvo animale…" },
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
    },
    [busy, logScan, resolveAnimalForProfessional, routeAfterProfessionalLookup, safePush, showBanner]
  );

  useEffect(() => {
    if (!directValue || directHandledRef.current) return;
    directHandledRef.current = true;
    void handleScan(directValue);
  }, [directValue, handleScan]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-[#dde4ec] bg-white p-6 shadow-[0_24px_60px_rgba(42,56,86,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                  Scansione
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#30486f]">
                  Apri rapidamente una scheda animale
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f708a] sm:text-base">
                  Usa la fotocamera del telefono, la webcam del computer oppure inserisci il codice
                  manualmente. Se hai già accesso, la scheda si apre subito. Se manca autorizzazione,
                  parte la richiesta al proprietario.
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-[#e3e9f0] bg-[#f8fbff] px-4 py-3 text-sm text-[#5f708a]">
                <div className="font-semibold text-[#30486f]">Stato</div>
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
                className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
              >
                Avvia fotocamera / webcam
              </button>

              <button
                type="button"
                onClick={openCodeMode}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff] disabled:opacity-60"
              >
                Inserisci codice / usa lettore
              </button>
            </div>
          </div>

          {banner && (
            <div
              className={`rounded-[1.4rem] border p-4 shadow-sm ${
                banner.kind === "error"
                  ? "border-red-200 bg-red-50"
                  : banner.kind === "success"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-[#e3e9f0] bg-white"
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
                  className="rounded-xl border border-[#d7dfe9] bg-white px-3 py-1 text-xs font-medium text-[#30486f] transition hover:bg-[#f8fbff]"
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
              description="La modalità più rapida per QR UNIMALIA e codici visibili."
              icon="📷"
              onClick={openCameraMode}
              disabled={busy}
            />
            <ModeButton
              active={mode === "codice"}
              title="Codice / lettore"
              description="Incolla il codice o usa un lettore USB collegato."
              icon="⌨️"
              onClick={openCodeMode}
              disabled={busy}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.4rem] border border-[#e3e9f0] bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-[#30486f]">1. Acquisisci codice</div>
              <div className="mt-1 text-xs text-[#6f7d91]">
                QR UNIMALIA, microchip, UUID o codice compatibile.
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-[#e3e9f0] bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-[#30486f]">2. Verifica accesso</div>
              <div className="mt-1 text-xs text-[#6f7d91]">
                Se l’animale è già autorizzato, entri subito nella scheda.
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-[#e3e9f0] bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-[#30486f]">3. Se manca accesso</div>
              <div className="mt-1 text-xs text-[#6f7d91]">
                Parte la richiesta al proprietario e resti in attesa di conferma.
              </div>
            </div>
          </div>

          {mode === "camera" && (
            <div
              ref={cameraSectionRef}
              className="rounded-[2rem] border border-[#dde4ec] bg-white p-6 shadow-[0_24px_60px_rgba(42,56,86,0.08)]"
            >
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#30486f]">Fotocamera / webcam</h2>
                <p className="mt-1 text-sm text-[#5f708a]">
                  Punta la fotocamera del telefono o la webcam del computer verso il codice.
                </p>
              </div>

              <CameraScanner onScan={(value) => handleScan(value)} disabled={busy} />

              <div className="mt-4 rounded-[1.2rem] bg-[#f8fbff] p-4 text-xs text-[#6f7d91]">
                Supporta QR UNIMALIA, link compatibili, UUID diretti e microchip da 15 cifre.
              </div>
            </div>
          )}

          {mode === "codice" && (
            <div
              ref={codeSectionRef}
              className="rounded-[2rem] border border-[#dde4ec] bg-white p-6 shadow-[0_24px_60px_rgba(42,56,86,0.08)] space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-[#30486f]">Codice / lettore</h2>
                <p className="mt-1 text-sm text-[#5f708a]">
                  Usa questa area se vuoi incollare un codice manualmente oppure leggere il microchip
                  con un lettore USB.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#30486f]">
                    Codice o link
                  </label>
                  <input
                    className="mt-1 w-full rounded-[1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#30486f]"
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
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
                    disabled={busy || !manualValue.trim()}
                    onClick={() => void handleScan(manualValue)}
                  >
                    {busy ? <Spinner /> : null}
                    <span>Apri scheda animale</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                    disabled={busy}
                    onClick={() => setManualValue("")}
                  >
                    Pulisci
                  </button>
                </div>
              </div>

              <div className="border-t border-[#e3e9f0] pt-5">
                <h3 className="text-sm font-semibold text-[#30486f]">Oppure usa il lettore USB</h3>
                <p className="mt-1 text-sm text-[#5f708a]">
                  Se il lettore è collegato, acquisisci qui il codice senza cambiare pagina.
                </p>

                <div className="mt-4">
                  <UsbScannerMode onScan={handleScan} disabled={busy} />
                </div>
              </div>

              <div className="rounded-[1.2rem] bg-[#f8fbff] p-4 text-xs text-[#6f7d91]">
                Se il microchip non viene trovato, si apre la gestione manuale per creare o associare
                l’animale.
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}