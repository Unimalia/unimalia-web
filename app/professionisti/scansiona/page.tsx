"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "@/lib/supabaseClient";

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/**
 * Regola:
 * - Se scansiono "UNIMALIA:<uuid>" => cerco animals.unimalia_code = uuid
 * - Altrimenti => considero microchip e cerco animals.chip_number = valore normalizzato
 *
 * Supporto extra:
 * - Se scansiono una URL tipo https://unimalia.it/a/<uuid> => tratto <uuid> come unimalia_code
 */
function parseScanned(raw: string) {
  const t = (raw || "").trim();

  // URL /a/<uuid>
  try {
    const u = new URL(t);
    if (u.pathname.startsWith("/a/")) {
      const code = u.pathname.replace("/a/", "").trim();
      return { kind: "unimalia" as const, value: code };
    }
  } catch {
    // non è una URL
  }

  // path /a/<uuid>
  if (t.startsWith("/a/")) {
    return { kind: "unimalia" as const, value: t.replace("/a/", "").trim() };
  }

  // UNIMALIA:<uuid>
  if (/^UNIMALIA:/i.test(t)) {
    return { kind: "unimalia" as const, value: t.replace(/^UNIMALIA:/i, "").trim() };
  }

  // animal uuid diretto (se qualcuno lo usa)
  if (isUuid(t)) {
    return { kind: "animal_id" as const, value: t };
  }

  // microchip: normalizza
  const cleaned = t
    .replace(/^microchip[:\s]*/i, "")
    .replace(/^chip[:\s]*/i, "")
    .replace(/^id[:\s]*/i, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9a-zA-Z\-]/g, "");

  return { kind: "chip" as const, value: cleaned };
}

export default function ScansionaProPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Avvio fotocamera…");

  // anti-loop: se legge lo stesso codice ripetutamente, lo ignoriamo per un attimo
  const [lastKey, setLastKey] = useState<string | null>(null);
  const lastTsRef = useRef<number>(0);

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
            const parsed = parseScanned(raw);
            const key = `${parsed.kind}:${parsed.value}`;

            const now = Date.now();
            if (key === lastKey && now - lastTsRef.current < 1200) return; // 1.2s
            setLastKey(key);
            lastTsRef.current = now;

            if (!parsed.value) {
              setError("Codice non valido. Riprova.");
              setStatus("Pronto.");
              return;
            }

            setError(null);
            setStatus("Codice letto ✅ Cerco l’animale…");

            // 1) UNIMALIA CODE
            if (parsed.kind === "unimalia") {
              const code = parsed.value;
              if (!isUuid(code)) {
                setError("UNIMALIA ID non valido. Riprova.");
                setStatus("Pronto.");
                return;
              }

              const { data, error } = await supabase
                .from("animals")
                .select("id")
                .eq("unimalia_code", code)
                .limit(1);

              if (error) {
                setError("Errore nella ricerca. Riprova.");
                setStatus("Pronto.");
                return;
              }

              const id = data?.[0]?.id as string | undefined;
              if (!id) {
                setError("Nessun animale trovato con questo UNIMALIA ID.");
                setStatus("Pronto.");
                return;
              }

              try {
                controls.stop();
              } catch {}

              router.push(`/professionisti/animali/${id}`);
              return;
            }

            // 2) animal id diretto
            if (parsed.kind === "animal_id") {
              try {
                controls.stop();
              } catch {}
              router.push(`/professionisti/animali/${parsed.value}`);
              return;
            }

            // 3) MICROCHIP
            const chip = parsed.value;
            if (chip.length < 6) {
              setError("Codice troppo corto. Riprova.");
              setStatus("Pronto.");
              return;
            }

            const { data, error } = await supabase
              .from("animals")
              .select("id")
              .eq("chip_number", chip)
              .limit(1);

            if (error) {
              setError("Errore nella ricerca del microchip. Riprova.");
              setStatus("Pronto.");
              return;
            }

            const id = data?.[0]?.id as string | undefined;
            if (!id) {
              setError(
                "Nessun profilo UNIMALIA trovato per questo microchip. Chiedi al proprietario di registrare l’animale in “Identità animale”."
              );
              setStatus("Pronto.");
              return;
            }

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

        setStatus("Inquadra QR o barcode…");
      } catch (e: any) {
        setError(
          e?.message ||
            "Impossibile avviare la fotocamera. Controlla i permessi oppure prova con un altro browser."
        );
        setStatus("Errore.");
      }
    }

    start();

    return () => {
      alive = false;
      if (stopFn) stopFn();
    };
  }, [router, lastKey]);

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
        Scansiona:
        <span className="font-semibold"> microchip (barcode/QR)</span> oppure
        <span className="font-semibold"> UNIMALIA ID</span> (per animali senza microchip).
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

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600">
        <p className="font-semibold text-zinc-800">Regola UNIMALIA</p>
        <p className="mt-1">
          Se l’animale ha microchip: il codice digitale è il microchip.
          <br />
          Se non ha microchip: il codice digitale è UNIMALIA ID (QR/Barcode interno).
        </p>
      </div>
    </main>
  );
}
