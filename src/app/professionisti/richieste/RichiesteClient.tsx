"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function buildTempLink(animalId: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const token = crypto.randomUUID();
  return `${base}/professionisti/richieste?animal=${encodeURIComponent(
    animalId
  )}&token=${encodeURIComponent(token)}`;
}

export default function RichiesteClient() {
  const searchParams = useSearchParams();

  const [animalId, setAnimalId] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Prefill dall'URL: /professionisti/richieste?animal=...
  useEffect(() => {
    const fromUrl = (searchParams.get("animal") || "").trim();
    if (!fromUrl) return;
    setAnimalId((prev) => (prev.trim().length ? prev : fromUrl));
  }, [searchParams]);

  const canGenerate = useMemo(() => animalId.trim().length >= 3, [animalId]);

  async function onGenerate() {
    setCopied(false);
    const link = buildTempLink(animalId.trim());
    setGenerated(link);

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function onCopy() {
    if (!generated) return;
    setCopied(false);
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Richieste consulto</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Invia un link temporaneo a un professionista per visualizzare la scheda sanitaria
          dell’animale. (Ora: UI + copia link. Poi: token vero via backend, stessa UX.)
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Crea link temporaneo</h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={animalId}
            onChange={(e) => setAnimalId(e.target.value)}
            placeholder="ID animale / microchip / codice (es. 12345)"
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
          />
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="h-11 rounded-2xl bg-black px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Genera
          </button>
        </div>

        {generated ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-700">Link temporaneo</div>
                <div className="mt-1 break-all text-sm text-zinc-800">{generated}</div>
                <div className="mt-2 text-xs text-zinc-500">
                  {copied
                    ? "Copiato ✅"
                    : "Se supportato, viene copiato automaticamente. Altrimenti copia manualmente."}
                </div>
              </div>

              <button
                type="button"
                onClick={onCopy}
                className="shrink-0 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Copia
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900">Storico richieste</h3>
          <span className="text-xs text-zinc-500">In arrivo</span>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
          Qui mostreremo richieste inviate/ricevute, stato, scadenza token e azioni (revoca).
        </div>
      </div>
    </div>
  );
}