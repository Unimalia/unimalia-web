"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";

function normalizeScanResult(text: string) {
  const t = text.trim();

  try {
    const u = new URL(t);
    if (u.pathname.startsWith("/a/")) return u.pathname; // "/a/<token>"
  } catch {}

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRe.test(t)) return `/a/${t}`;

  return t;
}

function isAPath(p: string) {
  return typeof p === "string" && p.startsWith("/a/");
}

export default function ScansionaPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const controlsStopRef = useRef<null | (() => void)>(null);
  const startingRef = useRef(false);

  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [manualValue, setManualValue] = useState("");

  const manualValueTrim = useMemo(() => manualValue.trim(), [manualValue]);

  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const stop = useCallback(() => {
    try {
      controlsStopRef.current?.();
    } catch {}
    controlsStopRef.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;

    setError(null);
    setRunning(true);

    try {
      const el = videoRef.current;
      if (!el) throw new Error("Video element non pronto.");

      stop();

      const codeReader = new BrowserMultiFormatReader();

      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      };

      const controls = await codeReader.decodeFromConstraints(
        constraints,
        el,
        (result) => {
          if (!result) return;

          const text = result.getText();
          const path = normalizeScanResult(text);

          try {
            controls.stop();
          } catch {}

          controlsStopRef.current = null;
          setRunning(false);

          router.push(path);
        }
      );

      controlsStopRef.current = () => {
        try {
          controls.stop();
        } catch {}
      };
    } catch (e: any) {
      setError(
        e?.message ||
          "Impossibile avviare la fotocamera. Controlla permessi o prova con un altro browser."
      );
      setRunning(false);
    } finally {
      startingRef.current = false;
    }
  }, [router, stop]);

  useEffect(() => {
    if (mode === "scan") start();
    else stop();
    return () => stop();
  }, [mode, start, stop]);

  const onSubmitManual = useCallback(() => {
    setError(null);

    if (!manualValueTrim) {
      setError("Inserisci un codice o un link.");
      return;
    }

    const path = normalizeScanResult(manualValueTrim);

    if (isAPath(path)) {
      router.push(path);
      return;
    }

    router.push(
      `/professionisti/scansiona/manuale?value=${encodeURIComponent(
        manualValueTrim
      )}`
    );
  }, [manualValueTrim, router]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Leggi QR / Codice a barre
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Scansiona con la fotocamera oppure inserisci un codice manualmente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("scan")}
              className={
                mode === "scan"
                  ? "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              }
            >
              Scansiona
            </button>

            <button
              type="button"
              onClick={() => setMode("manual")}
              className={
                mode === "manual"
                  ? "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              }
            >
              Inserisci manualmente
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              ← Indietro
            </button>
          </div>
        </div>
      </div>

      {mode === "scan" ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-black shadow-sm">
            <video
              ref={videoRef}
              className="h-[420px] w-full object-cover"
              muted
              playsInline
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => start()}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
              disabled={running}
              title={running ? "Scansione già in corso" : "Riavvia scansione"}
            >
              {running ? "Scansione in corso…" : "Riavvia scansione"}
            </button>

            {running && (
              <p className="text-xs text-zinc-500">
                Se la camera non si avvia, controlla i permessi del browser.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Inserimento manuale
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Incolla un link UNIMALIA, un UUID, un barcode o qualsiasi testo.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="Es: https://unimalia.it/a/… oppure 123456789…"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            />

            <button
              type="button"
              onClick={onSubmitManual}
              className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-900"
            >
              Apri
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}