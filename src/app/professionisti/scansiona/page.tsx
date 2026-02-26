"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";

function normalizeScanResult(text: string) {
  const t = text.trim();

  // Se è già un link unimalia tipo https://unimalia.it/a/<token>
  try {
    const u = new URL(t);
    if (u.pathname.startsWith("/a/")) return u.pathname; // "/a/<token>"
  } catch {}

  // Se è solo un token uuid, lo trasformo in route
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRe.test(t)) return `/a/${t}`;

  return t;
}

export default function ScansionaPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const controlsStopRef = useRef<null | (() => void)>(null);
  const startingRef = useRef(false);

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

      // Stop eventuale sessione precedente
      stop();

      const codeReader = new BrowserMultiFormatReader();

      // Forza (idealmente) camera posteriore: facingMode "environment"
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

          // Stop camera appena trovato
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
    start();
    return () => stop();
  }, [start, stop]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Leggi QR / Codice a barre
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Inquadra il codice: appena viene riconosciuto, UNIMALIA aprirà automaticamente la scheda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => start()}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
              disabled={running}
              title={running ? "Scansione già in corso" : "Riavvia scansione"}
            >
              {running ? "Scansione in corso…" : "Riavvia scansione"}
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

      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-black shadow-sm">
        <video
          ref={videoRef}
          className="h-[420px] w-full object-cover"
          muted
          playsInline
        />
      </div>

      {running && (
        <p className="text-xs text-zinc-500">
          Se la camera non si avvia, controlla i permessi del browser. Su mobile usa preferibilmente Chrome/Safari aggiornati.
        </p>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700">
          {error}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => start()}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
            >
              Riprova
            </button>
          </div>
        </div>
      )}
    </div>
  );
}