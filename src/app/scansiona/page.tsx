"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "@/lib/supabaseClient";
import { normalizeScanResult } from "@/lib/normalizeScanResult";
import { isUuid } from "@/lib/server/validators";

function publicTokenFromValue(raw: string) {
  const value = normalizeScanResult(raw);

  if (!value) return "";

  if (/^unimalia[:\-]/i.test(value)) {
    return value.replace(/^unimalia[:\-]/i, "").trim();
  }

  if (isUuid(value)) return value;

  return value.trim();
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Impossibile avviare la fotocamera. Controlla permessi o prova con un altro browser.";
}

export default function ScansionaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = (searchParams.get("q") || "").trim();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsStopRef = useRef<null | (() => void)>(null);
  const startingRef = useRef(false);
  const handledDirectRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [routing, setRouting] = useState(false);

  const stop = useCallback(() => {
    try {
      controlsStopRef.current?.();
    } catch {}
    controlsStopRef.current = null;
    setRunning(false);
  }, []);

  const routeDirectValue = useCallback(
    async (raw: string) => {
      const normalized = normalizeScanResult(raw);
      const publicToken = publicTokenFromValue(normalized);

      if (!publicToken) {
        setError("Codice QR non valido.");
        setRouting(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const isProfessional =
          user?.app_metadata?.is_professional === true ||
          user?.app_metadata?.is_vet === true;

        if (isProfessional) {
          router.replace(
            `/professionisti/scansiona?value=${encodeURIComponent(normalized)}`
          );
          return;
        }

        router.replace(`/a/${encodeURIComponent(publicToken)}`);
      } catch {
        router.replace(`/a/${encodeURIComponent(publicToken)}`);
      }
    },
    [router]
  );

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
        async (result) => {
          if (!result) return;

          const text = result.getText();

          try {
            controls.stop();
          } catch {}

          controlsStopRef.current = null;
          setRunning(false);
          setRouting(true);

          await routeDirectValue(text);
        }
      );

      controlsStopRef.current = () => {
        try {
          controls.stop();
        } catch {}
      };
    } catch (error: unknown) {
      setError(getErrorMessage(error));
      setRunning(false);
    } finally {
      startingRef.current = false;
    }
  }, [routeDirectValue, stop]);

  useEffect(() => {
    if (qParam && !handledDirectRef.current) {
      handledDirectRef.current = true;
      setRouting(true);
      void routeDirectValue(qParam);
      return;
    }

    if (!qParam) {
      void start();
    }

    return () => stop();
  }, [qParam, routeDirectValue, start, stop]);

  if (routing) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Reindirizzamento in corso…
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sto aprendo la scheda corretta in base al contesto di accesso.
          </p>
        </div>
      </div>
    );
  }

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