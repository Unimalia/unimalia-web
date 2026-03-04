"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FoundAnimal = {
  id: string;
  name: string;
  species: string | null;
  chip_number: string | null;
};

export default function RequestAccessClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const animalId = (sp.get("animalId") || "").trim();
  const chip = (sp.get("chip") || "").trim();

  const [loading, setLoading] = React.useState(true);
  const [animal, setAnimal] = React.useState<FoundAnimal | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

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

        const qs = animalId ? `id=${encodeURIComponent(animalId)}` : `chip=${encodeURIComponent(chip)}`;
        const res = await fetch(`/api/animals/find?${qs}`, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));

        if (!alive) return;

        if (!res.ok) {
          setErr(j?.error || "Errore lookup animale");
          return;
        }
        if (!j?.found || !j?.animal?.id) {
          setErr("Animale non trovato.");
          return;
        }

        setAnimal({
          id: j.animal.id,
          name: j.animal.name || "",
          species: j.animal.species ?? null,
          chip_number: j.animal.chip_number ?? null,
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

  async function sendRequest() {
    if (!animal?.id && !chip) {
      setErr("missing animalId or microchip");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/professionisti/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: animal?.id || null,
          chip: chip || null,
          requestedScope: ["read"],
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j?.error || "Errore invio richiesta");
        return;
      }

      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Richiesta accesso</h1>
        <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => router.back()}>
          Indietro
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border p-4 text-sm text-neutral-600">Caricamento…</div>
      ) : null}

      {!loading && err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {err}
        </div>
      ) : null}

      {!loading && animal ? (
        <div className="rounded-2xl border bg-white p-4 space-y-2">
          <div className="text-sm text-neutral-600">Animale trovato</div>
          <div className="text-lg font-semibold">
            {animal.name || "—"} {animal.species ? `— ${animal.species}` : ""}
          </div>
          <div className="text-sm text-neutral-700">
            {animal.chip_number ? (
              <>
                Microchip: <span className="font-mono">{animal.chip_number}</span>
              </>
            ) : (
              <span className="opacity-70">Microchip non presente</span>
            )}
          </div>

          {!done ? (
            <button
              className="mt-3 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
              onClick={() => void sendRequest()}
              disabled={busy}
            >
              {busy ? "Invio…" : "Invia richiesta accesso"}
            </button>
          ) : (
            <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              Richiesta inviata. Attendi approvazione del proprietario.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}