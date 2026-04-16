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
  const [loadingCloseOther, setLoadingCloseOther] = useState(false);

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

  async function closeOther() {
    if (type !== "lost") return;

    const ok = window.confirm(
      "Confermi di voler chiudere questo annuncio per un motivo diverso dal ritrovamento?"
    );
    if (!ok) return;

    setLoadingCloseOther(true);
    setResultMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/reports/close-other", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data?.error || "Errore durante la chiusura dell’annuncio.");
        return;
      }

      setResultMsg("✅ Annuncio chiuso correttamente.");
      router.refresh();
    } catch {
      setErrorMsg("Errore di rete o server.");
    } finally {
      setLoadingCloseOther(false);
    }
  }

  const isClosedFound = status === "closed_found";
  const isClosedOther = status === "closed_other";
  const isExpired = status === "expired";
  const isActive = status === "active";

  return (
    <div className="grid gap-5">
      <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_8px_22px_rgba(42,56,86,0.03)]">
        <h3 className="text-lg font-semibold text-[#30486f]">Condivisione</h3>
        <p className="mt-2 text-sm leading-7 text-[#5f708a]">
          Copia il link o il testo pronto, poi incollalo su Facebook dove vuoi pubblicare il post.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copyText(publicUrl, "✅ Link annuncio copiato negli appunti.")}
            className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] hover:bg-[#f8fbff]"
          >
            Copia link annuncio
          </button>

          <button
            type="button"
            onClick={() => copyText(textForFacebook, "✅ Testo per Facebook copiato negli appunti.")}
            className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] hover:bg-[#f8fbff]"
          >
            Copia testo per Facebook
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] hover:bg-[#263b59]"
          >
            Apri annuncio pubblico
          </a>
        </div>
      </div>

      {type === "lost" ? (
        <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_8px_22px_rgba(42,56,86,0.03)]">
          <h3 className="text-lg font-semibold text-[#30486f]">Stato annuncio</h3>
          <p className="mt-2 text-sm leading-7 text-[#5f708a]">
            Da qui puoi chiudere l’annuncio se l’animale è stato ritrovato oppure se non deve più
            restare online.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {isActive ? (
              <>
                <button
                  type="button"
                  onClick={markFound}
                  disabled={loadingFound || loadingCloseOther}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                >
                  {loadingFound ? "Aggiornamento..." : "Segna come ritrovato"}
                </button>

                <button
                  type="button"
                  onClick={closeOther}
                  disabled={loadingFound || loadingCloseOther}
                  className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] hover:bg-[#f8fbff] disabled:opacity-60"
                >
                  {loadingCloseOther ? "Chiusura..." : "Chiudi annuncio"}
                </button>
              </>
            ) : null}
          </div>

          {!isActive ? (
            <div className="mt-4 rounded-[1.1rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {isClosedFound
                ? "Questo annuncio risulta già chiuso come ritrovato."
                : isClosedOther
                  ? "Questo annuncio risulta già chiuso."
                  : isExpired
                    ? "Questo annuncio risulta scaduto."
                    : "Questo annuncio non è più attivo."}
            </div>
          ) : null}
        </div>
      ) : null}

      {resultMsg ? (
        <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {resultMsg}
        </div>
      ) : null}

      {errorMsg ? (
        <div className="rounded-[1.1rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}
    </div>
  );
}