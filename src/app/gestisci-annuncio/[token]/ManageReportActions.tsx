"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
  type: "lost" | "found" | "sighted";
  status: string;
  publicUrl: string;
  manageUrl: string;
  textForFacebook: string;
};

export default function ManageReportActions({
  token,
  type,
  status,
  publicUrl,
  textForFacebook,
}: Props) {
  const router = useRouter();

  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingFound, setLoadingFound] = useState(false);

  async function copyText(value: string, successMessage: string) {
    setResultMsg(null);
    setErrorMsg(null);

    try {
      await navigator.clipboard.writeText(value);
      setResultMsg(successMessage);
    } catch {
      setErrorMsg("Non sono riuscito a copiare negli appunti.");
    }
  }

  async function markFound() {
    if (type !== "lost") return;
    const ok = window.confirm(
      "Confermi che l’animale è stato ritrovato e vuoi chiudere l’annuncio?"
    );
    if (!ok) return;

    setLoadingFound(true);
    setResultMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/reports/mark-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data?.error || "Errore durante la chiusura dell’annuncio.");
        return;
      }

      setResultMsg("✅ Annuncio aggiornato: segnato come ritrovato.");
      router.refresh();
    } catch {
      setErrorMsg("Errore di rete o server.");
    } finally {
      setLoadingFound(false);
    }
  }

  const isClosedFound = status === "closed_found";

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-zinc-900">Condivisione</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Copia il link o il testo pronto, poi incollalo su Facebook dove vuoi pubblicare il post.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copyText(publicUrl, "✅ Link annuncio copiato negli appunti.")}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Copia link annuncio
          </button>

          <button
            type="button"
            onClick={() => copyText(textForFacebook, "✅ Testo per Facebook copiato negli appunti.")}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Copia testo per Facebook
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Apri annuncio pubblico
          </a>
        </div>
      </div>

      {type === "lost" ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-zinc-900">Stato annuncio</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Quando l’animale torna a casa, chiudi l’annuncio da qui.
          </p>

          <div className="mt-4">
            {!isClosedFound && status === "active" ? (
              <button
                type="button"
                onClick={markFound}
                disabled={loadingFound}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
              >
                {loadingFound ? "Aggiornamento..." : "Segna come ritrovato"}
              </button>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Questo annuncio risulta già chiuso / ritrovato.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {resultMsg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {resultMsg}
        </div>
      ) : null}

      {errorMsg ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}
    </div>
  );
}