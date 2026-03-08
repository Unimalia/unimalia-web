"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FoundAnimal = {
  id: string;
  name: string;
  species: string | null;
  chip_number: string | null;
};

type WaitStatus = "idle" | "sending" | "waiting" | "approved" | "error";
type ScopeKey = "read" | "write" | "upload";

function scopeLabel(scope: ScopeKey) {
  if (scope === "read") return "Lettura";
  if (scope === "write") return "Modifica";
  return "Upload allegati";
}

export default function RequestAccessClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const animalId = (sp.get("animalId") || sp.get("id") || "").trim();
  const chip = (sp.get("chip") || sp.get("microchip") || "").trim();
  const auto = sp.get("auto") === "1";

  const [loading, setLoading] = React.useState(true);
  const [animal, setAnimal] = React.useState<FoundAnimal | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [autoStarted, setAutoStarted] = React.useState(false);
  const [status, setStatus] = React.useState<WaitStatus>("idle");
  const [secondsWaiting, setSecondsWaiting] = React.useState(0);
  const [selectedScopes, setSelectedScopes] = React.useState<ScopeKey[]>(["read", "write", "upload"]);

  const resolvedAnimalId = animal?.id || animalId || null;
  const resolvedChip = chip || animal?.chip_number || null;

  React.useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);
      setAnimal(null);

      try {
        if (!animalId && !chip) {
          setErr("Manca animalId o microchip in URL.");
          return;
        }

        const qs = animalId
          ? `id=${encodeURIComponent(animalId)}`
          : `chip=${encodeURIComponent(chip)}`;

        const res = await fetch(`/api/animals/find?${qs}`, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));

        if (!alive) return;

        if (!res.ok) {
          setErr(j?.error || "Errore ricerca animale");
          return;
        }

        const a = j?.animal ?? null;
        const id = a?.id || j?.animalId || null;

        if (!id) {
          setErr("Animale non trovato.");
          return;
        }

        setAnimal({
          id: String(id),
          name: String(a?.name ?? ""),
          species: (a?.species ?? null) as string | null,
          chip_number: (a?.chip_number ?? null) as string | null,
        });
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [animalId, chip]);

  function toggleScope(scope: ScopeKey) {
    setSelectedScopes((prev) => {
      if (prev.includes(scope)) {
        const next = prev.filter((x) => x !== scope);
        return next.length > 0 ? next : ["read"];
      }
      return [...prev, scope];
    });
  }

  async function checkAccessNow(targetAnimalId: string) {
    const res = await fetch(
      `/api/professionisti/grants/check?animal_id=${encodeURIComponent(targetAnimalId)}`,
      { cache: "no-store" }
    );
    const j = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(j?.error || "Errore controllo accesso");
    }

    return Boolean(j?.ok);
  }

  async function sendRequest() {
    if (!resolvedAnimalId && !resolvedChip) {
      setErr("Dati insufficienti per inviare la richiesta.");
      setStatus("error");
      return;
    }

    if (selectedScopes.length === 0) {
      setErr("Seleziona almeno un permesso.");
      setStatus("error");
      return;
    }

    setBusy(true);
    setErr(null);
    setStatus("sending");

    try {
      const body = {
        animalId: resolvedAnimalId,
        animal_id: resolvedAnimalId,
        chip: resolvedChip,
        microchip: resolvedChip,
        requestedScope: selectedScopes,
        requested_scope: selectedScopes,
      };

      const res = await fetch("/api/professionisti/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(j?.error || "Errore invio richiesta");
        setStatus("error");
        return;
      }

      setDone(true);
      setStatus("waiting");
      setSecondsWaiting(0);
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    if (!auto || !animal || done || busy || autoStarted) return;
    setAutoStarted(true);
    void sendRequest();
  }, [auto, animal, done, busy, autoStarted]);

  React.useEffect(() => {
    if (!done || !resolvedAnimalId || status !== "waiting") return;

    let alive = true;

    const timer = window.setInterval(() => {
      setSecondsWaiting((s) => s + 2);
    }, 2000);

    const poller = window.setInterval(async () => {
      try {
        const hasAccess = await checkAccessNow(resolvedAnimalId);

        if (!alive) return;

        if (hasAccess) {
          setStatus("approved");
          window.clearInterval(timer);
          window.clearInterval(poller);

          setTimeout(() => {
            router.replace(`/professionisti/animali/${encodeURIComponent(resolvedAnimalId)}`);
          }, 900);
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Errore controllo accesso");
      }
    }, 2500);

    return () => {
      alive = false;
      window.clearInterval(timer);
      window.clearInterval(poller);
    };
  }, [done, resolvedAnimalId, status, router]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-500">AUTORIZZAZIONE</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Richiesta accesso</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Se non hai ancora accesso a questo animale, la richiesta viene inviata al proprietario
              per l’approvazione.
            </p>
          </div>

          <button
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            onClick={() => router.back()}
          >
            Indietro
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
          Caricamento animale…
        </div>
      ) : null}

      {!loading && err ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
          {err}
        </div>
      ) : null}

      {!loading && animal ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">ANIMALE</p>

          <div className="mt-3 space-y-2">
            <div className="text-lg font-semibold text-zinc-900">
              {animal.name || "—"} {animal.species ? `— ${animal.species}` : ""}
            </div>

            <div className="text-sm text-zinc-700">
              {animal.chip_number ? (
                <>
                  Microchip: <span className="font-mono">{animal.chip_number}</span>
                </>
              ) : (
                <span className="opacity-70">Microchip non presente</span>
              )}
            </div>
          </div>

          {!done ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700">
                {auto
                  ? "Stiamo inviando automaticamente la richiesta di accesso con permessi completi standard."
                  : "Seleziona i permessi richiesti e invia la richiesta al proprietario."}
              </div>

              {!auto && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <label className="block text-sm font-medium text-zinc-900">
                    Permessi richiesti
                  </label>

                  <div className="mt-3 flex flex-col gap-2">
                    {(["read", "write", "upload"] as ScopeKey[]).map((scope) => (
                      <label
                        key={scope}
                        className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900"
                      >
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope)}
                          onChange={() => toggleScope(scope)}
                        />
                        <span>{scopeLabel(scope)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!auto && (
                <button
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                  onClick={() => void sendRequest()}
                  disabled={busy}
                >
                  {busy ? "Invio in corso..." : "Invia richiesta accesso"}
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700">
                Permessi richiesti:{" "}
                <span className="font-semibold">
                  {selectedScopes.map(scopeLabel).join(", ")}
                </span>
              </div>

              {status === "waiting" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="font-semibold">In attesa di approvazione</div>
                  <div className="mt-1">
                    Il proprietario deve autorizzare l’accesso. Questa pagina si aggiorna da sola.
                  </div>
                  <div className="mt-2 text-xs opacity-80">Attesa attuale: {secondsWaiting}s</div>
                </div>
              )}

              {status === "approved" && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <div className="font-semibold">Accesso approvato</div>
                  <div className="mt-1">Sto aprendo automaticamente la scheda animale…</div>
                </div>
              )}

              {status === "sending" && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                  Invio richiesta in corso…
                </div>
              )}

              <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700">
                Una volta approvato dal proprietario, l’animale si aprirà automaticamente.
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}