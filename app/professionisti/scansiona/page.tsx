"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "@/lib/supabaseClient";

function normalize(text: string) {
  return text.replace(/\s+/g, "").trim();
}

export default function ScansionaProPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Avvio fotocamera…");

  useEffect(() => {
    let alive = true;
    let stopFn: null | (() => void) = null;

    async function start() {
      setError(null);
      setStatus("Avvio fotocamera…");

      try {
        const reader = new BrowserMultiFormatReader();

        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          async (result) => {
            if (!alive) return;
            if (!result) return;

            const raw = result.getText();
            const chip = normalize(raw);

            if (!chip) return;

            setStatus("Codice letto ✅ Cerco l’animale…");

            // Cerco per microchip (chip_number)
            const { data, error } = await supabase
              .from("animals")
              .select("id")
              .eq("chip_number", chip)
              .limit(1);

            if (error) {
              setError("Errore nella ricerca. Riprova.");
              setStatus("Pronto.");
              return;
            }

            const id = data?.[0]?.id as string | undefined;
            if (!id) {
              setError("Nessun animale trovato con questo microchip.");
              setStatus("Pronto.");
              return;
            }

            // Stop camera e apri profilo pro
            try {
              controls.stop();
            } catch {}

            router.push(`/professionisti/animali/${id}`);
          }
        );

        stopFn = () => {
          try {
            controls.stop();
          } catch {}
        };

        setStatus("Inquadra QR o barcode (microchip)...");
      } catch (e: any) {
        setError(
          e?.message ||
            "Impossibile avviare la fotocamera. Controlla permessi o prova con un altro browser."
        );
        setStatus("Errore.");
      }
    }

    start();

    return () => {
      alive = false;
      if (stopFn) stopFn();
    };
  }, [router]);

  return (
    <main>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Scanner professionisti</h1>

        <button
          type="button"
          onClick={() => router.push("/professionisti")}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          ← Portale
        </button>
      </div>

      <p className="mt-3 text-zinc-700">
        Leggi un <span className="font-semibold">barcode</span> o un{" "}
        <span className="font-semibold">QR</span> che contiene il numero microchip.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm">
        <video ref={videoRef} className="h-[420px] w-full object-cover" muted playsInline />
      </div>

      <p className="mt-3 text-sm text-zinc-700">{status}</p>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </main>
  );
}
