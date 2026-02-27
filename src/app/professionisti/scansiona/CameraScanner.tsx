"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

type Props = {
  onScan: (value: string) => void | Promise<void>;
  disabled?: boolean;
};

function normalizeScanText(input: string): string {
  return (input ?? "").trim();
}

/**
 * Evita falsi positivi tipo "-" "." ":" ecc.
 * Regola pratica:
 * - minimo 3 caratteri
 * - deve contenere almeno una lettera o un numero
 * - non deve essere composto solo da punteggiatura/segni
 */
function isMeaningfulScan(text: string): boolean {
  const t = normalizeScanText(text);
  if (!t) return false;

  // troppo corto (tipico falso positivo da schermo / riflessi)
  if (t.length < 3) return false;

  // se non contiene alcun carattere alfanumerico -> è rumore
  if (!/[a-zA-Z0-9]/.test(t)) return false;

  // casi estremi tipo "---" "..." "__" ecc.
  if (/^[-_.:;|/\\]+$/.test(t)) return false;

  return true;
}

export default function CameraScanner({ onScan, disabled = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastText, setLastText] = useState<string>("");

  // messaggio UX (es: codice non leggibile)
  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const hintTimerRef = useRef<number | null>(null);

  // throttle scans: evita doppie letture identiche in pochi ms
  const lastHitRef = useRef<{ text: string; ts: number } | null>(null);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    return () => {
      try {
        controlsRef.current?.stop();
      } catch {}
      controlsRef.current = null;
      readerRef.current = null;

      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };
  }, []);

  function showHint(message: string) {
    setHintMsg(message);
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => {
      setHintMsg(null);
      hintTimerRef.current = null;
    }, 2200);
  }

  async function start() {
    if (disabled) return;

    setErrorMsg(null);
    setStatus("starting");

    try {
      const video = videoRef.current;
      const reader = readerRef.current;
      if (!video || !reader) return;

      // stop eventuale sessione precedente
      try {
        controlsRef.current?.stop();
      } catch {}
      controlsRef.current = null;

      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      };

      const controls = await reader.decodeFromConstraints(constraints, video, (result) => {
        if (disabled) return;
        if (!result) return;

        const raw = result.getText?.() ?? String(result);
        const text = normalizeScanText(raw);

        // debug: capire se legge davvero
        setLastText(text);
        // eslint-disable-next-line no-console
        console.log("SCAN:", text);

        // se ZXing sta “agganciando” rumore (es: "-"), NON avviare flussi
        if (!isMeaningfulScan(text)) {
          showHint("Codice non leggibile. Prova ad aumentare dimensione/contrasto del QR.");
          return;
        }

        // throttle: stesso testo entro 900ms -> ignora
        const now = Date.now();
        const last = lastHitRef.current;
        if (last && last.text === text && now - last.ts < 900) return;
        lastHitRef.current = { text, ts: now };

        void onScan(text);
      });

      controlsRef.current = controls;
      setStatus("running");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message ?? "Impossibile avviare la fotocamera");
    }
  }

  function stop() {
    try {
      controlsRef.current?.stop();
    } catch {}
    controlsRef.current = null;
    setStatus("idle");
  }

  useEffect(() => {
    if (disabled && status === "running") stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">📷 Fotocamera</div>
        <div className="text-xs opacity-70">
          {status === "running" ? "attiva" : status === "starting" ? "avvio..." : ""}
        </div>
      </div>

      {errorMsg ? (
        <div className="rounded-xl border bg-red-50 p-3 text-sm">
          <div className="font-medium">Errore fotocamera</div>
          <div className="opacity-80">{errorMsg}</div>
        </div>
      ) : null}

      {hintMsg ? (
        <div className="rounded-xl border bg-amber-50 p-3 text-sm">
          <div className="font-medium">Suggerimento</div>
          <div className="opacity-80">{hintMsg}</div>
        </div>
      ) : null}

      <video ref={videoRef} className="w-full rounded-xl border" muted playsInline autoPlay />

      <div className="flex gap-2 flex-wrap">
        {status !== "running" ? (
          <button
            type="button"
            className="rounded-xl border px-3 py-2 text-sm"
            onClick={start}
            disabled={disabled}
          >
            Avvia fotocamera
          </button>
        ) : (
          <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={stop}>
            Ferma
          </button>
        )}
      </div>

      <div className="text-xs opacity-70">
        Inquadra QR/Barcode: quando viene letto, viene aperta automaticamente la scheda.
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
        <div className="font-semibold">Consigli per QR da schermo</div>
        <ul className="mt-2 list-disc space-y-1 pl-4 opacity-80">
          <li>Aumenta la dimensione del QR (zoom).</li>
          <li>Alza la luminosità dello schermo.</li>
          <li>Distanza consigliata 20–30 cm.</li>
          <li>Inclina leggermente il telefono per ridurre moiré/riflessi.</li>
        </ul>
      </div>

      {/* Debug visivo: così capisci se ZXing sta leggendo o no */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
        <div className="font-semibold">Debug</div>
        <div className="mt-1 break-all opacity-80">Ultimo scan: {lastText ? lastText : "—"}</div>
      </div>
    </div>
  );
}