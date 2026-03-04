"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Banner = { kind: "success" | "error" | "info"; text: string } | null;

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-label="loading"
    />
  );
}

export default function RequestAccessClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ lo scanner passa questi:
  const animalId = (sp.get("animalId") || "").trim();
  const chip = (sp.get("chip") || "").trim();

  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  // scope MVP (adatta se hai UI scope)
  const [scopeRead, setScopeRead] = useState(true);
  const [scopeWrite, setScopeWrite] = useState(false);
  const [scopeUpload, setScopeUpload] = useState(false);

  const scope = useMemo(() => {
    const s: string[] = [];
    if (scopeRead) s.push("read");
    if (scopeWrite) s.push("write");
    if (scopeUpload) s.push("upload");
    return s.length ? s : ["read"];
  }, [scopeRead, scopeWrite, scopeUpload]);

  const canSend = Boolean(animalId || chip);

  async function submit() {
    if (!canSend) {
      setBanner({
        kind: "error",
        text: "Manca animalId o microchip. Apri questa pagina dallo scanner (QR/UUID o microchip).",
      });
      return;
    }

    setBusy(true);
    setBanner({ kind: "info", text: "Invio richiesta…" });

    try {
      // ✅ IMPORTANTISSIMO: backend vuole animalId OPPURE microchip
      const payload: any = { scope };

      if (animalId) payload.animalId = animalId;
      else if (chip) payload.microchip = chip;

      const res = await fetch("/api/professionisti/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setBanner({ kind: "error", text: json?.error || "Errore invio richiesta" });
        return;
      }

      setBanner({ kind: "success", text: "Richiesta inviata. Attendi approvazione dell’owner." });

      // se vuoi, rimanda alle richieste del pro
      // router.push("/professionisti/richieste-accesso");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Richiesta accesso</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Invia una richiesta al proprietario per poter visualizzare la scheda.
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
          onClick={() => router.back()}
        >
          Indietro
        </button>
      </div>

      {banner && (
        <div
          className={`rounded-2xl border p-3 ${
            banner.kind === "error"
              ? "bg-red-50"
              : banner.kind === "success"
              ? "bg-green-50"
              : "bg-neutral-50"
          }`}
          role="status"
        >
          <div className="text-sm">{banner.text}</div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="text-sm font-semibold">Identificazione</div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border p-3">
            <div className="text-xs text-neutral-500">animalId (UUID)</div>
            <div className="mt-1 break-all text-sm">{animalId || "—"}</div>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-neutral-500">microchip</div>
            <div className="mt-1 break-all text-sm">{chip || "—"}</div>
          </div>
        </div>

        {!canSend && (
          <div className="text-sm text-red-700">
            Mancano i parametri: apri questa pagina dallo scanner (QR/UUID o microchip).
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="text-sm font-semibold">Permessi richiesti</div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={scopeRead}
            onChange={(e) => setScopeRead(e.target.checked)}
            disabled={busy}
          />
          Lettura (read)
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={scopeWrite}
            onChange={(e) => setScopeWrite(e.target.checked)}
            disabled={busy}
          />
          Scrittura (write)
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={scopeUpload}
            onChange={(e) => setScopeUpload(e.target.checked)}
            disabled={busy}
          />
          Upload (upload)
        </label>

        <div className="pt-2">
          <button
            type="button"
            className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-neutral-50 inline-flex items-center gap-2"
            onClick={() => void submit()}
            disabled={busy || !canSend}
          >
            {busy ? <Spinner /> : null}
            Invia richiesta
          </button>
        </div>
      </div>
    </div>
  );
}