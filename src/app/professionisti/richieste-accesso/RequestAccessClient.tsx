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

  // supporta: ?animalId=... oppure ?id=... (fallback)
  const animalId = (sp.get("animalId") || sp.get("id") || "").trim();

  // supporta: ?chip=... oppure ?microchip=... (fallback)
  const chip = (sp.get("chip") || sp.get("microchip") || "").trim();

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

        // ✅ usa parametri compatibili con più versioni dell’API
        // preferiamo animalId=..., altrimenti chip=...
        const qs = animalId
          ? `animalId=${encodeURIComponent(animalId)}`
          : `chip=${encodeURIComponent(chip)}`;

        const res = await fetch(`/api/animals/find?${qs}`, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));

        if (!alive) return;

        if (!res.ok) {
          setErr(j?.error || "Errore lookup animale");
          return;
        }

        // ✅ supporta risposte in forma { found, animal } oppure { animalId } ecc.
        const a = j?.animal ?? null;
        const id = a?.id || j?.animalId || null;

        if (!id) {
          setErr("Animale non trovato.");
          return;
        }

        setAnimal({
          id: String(id),
          name: String(a?.name ?? ""),
          species: (a?.species ?? null) as any,
          chip_number: (a?.chip_number ?? a?.microchip ?? null) as any,
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
    const resolvedAnimalId = animal?.id || animalId || null;
    const resolvedChip = chip || animal?.chip_number || null;

    if (!resolvedAnimalId && !resolvedChip) {
      setErr("missing animalId or microchip");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      // ✅ body “compatibile”: manda sia camelCase che snake_case, e sia chip che microchip
      const body = {
        animalId: resolvedAnimalId,
        animal_id: resolvedAnimalId,

        chip: resolvedChip,
        microchip: resolvedChip,

        requestedScope: ["read"],
        requested_scope: ["read"],
      };

      const res = await fetch("/api/professionisti/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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