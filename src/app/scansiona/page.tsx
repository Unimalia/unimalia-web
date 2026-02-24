"use client";

import { useEffect, useRef, useState } from "react";
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
  // (uuid v4 semplice)
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRe.test(t)) return `/a/${t}`;

  // Altrimenti lo lasciamo com’è
  return t;
}

export default function ScansionaPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let stopFn: null | (() => void) = null;
    let alive = true;

    async function start() {
      setError(null);
      setRunning(true);

      try {
        const codeReader = new BrowserMultiFormatReader();

        // Decodifica continua da camera
        const controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (!alive) return;

            if (result) {
              const text = result.getText();
              const path = normalizeScanResult(text);

              // Stop camera appena trovato
              try {
                controls.stop();
              } catch {}

              router.push(path);
            }
          }
        );

        stopFn = () => {
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
      }
    }

    // Avvia subito
    start();

    return () => {
      alive = false;
      if (stopFn) stopFn();
    };
  }, [router]);

  return (
    <main>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Leggi QR / Codice a barre</h1>

        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          ← Indietro
        </button>
      </div>

      <p className="mt-3 text-zinc-700">
        Inquadra il codice: appena viene riconosciuto, UNIMALIA aprirà automaticamente la scheda.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm">
        <video ref={videoRef} className="h-[420px] w-full object-cover" muted playsInline />
      </div>

      {running && (
        <p className="mt-3 text-xs text-zinc-500">
          Se la camera non si avvia, controlla i permessi del browser.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </main>
  );
}
