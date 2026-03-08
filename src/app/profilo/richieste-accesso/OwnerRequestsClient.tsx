"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Row = {
  id: string;
  created_at: string;
  animal_id: string;
  org_id: string;
  status: "pending" | "approved" | "rejected" | "blocked" | "revoked" | string;
  requested_scope?: string[] | null;
  expires_at?: string | null;
  animal_name?: string | null;
  org_name?: string | null;
};

type Duration = "24h" | "7d" | "6m" | "forever";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("it-IT");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Senza scadenza";
  return new Date(value).toLocaleDateString("it-IT");
}

function labelDuration(d: Duration) {
  if (d === "24h") return "24 ore";
  if (d === "7d") return "7 giorni";
  if (d === "6m") return "6 mesi";
  return "Senza scadenza";
}

export default function OwnerRequestsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [durationByRequestId, setDurationByRequestId] = useState<Record<string, Duration>>({});

  const animalId = searchParams.get("animalId");

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const url = animalId
        ? `/api/owner/access-requests?animalId=${encodeURIComponent(animalId)}`
        : `/api/owner/access-requests`;

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json?.error || "Errore caricamento richieste");
      const nextRows = json.rows ?? [];
      setRows(nextRows);

      setDurationByRequestId((prev) => {
        const next = { ...prev };
        for (const row of nextRows) {
          if (row.status === "pending" && !next[row.id]) next[row.id] = "7d";
        }
        return next;
      });
    } catch (e: any) {
      setError(e?.message || "Errore");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId]);

  const pending = useMemo(() => rows.filter((r) => r.status === "pending"), [rows]);
  const history = useMemo(() => rows.filter((r) => r.status !== "pending"), [rows]);

  async function act(id: string, action: "approve" | "reject" | "revoke") {
    const selectedDuration = durationByRequestId[id] ?? "7d";

    startTransition(async () => {
      const res = await fetch("/api/owner/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          duration: action === "approve" ? selectedDuration : undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "Operazione non riuscita");
        return;
      }

      await load();
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 p-4">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Richieste di accesso</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Qui puoi autorizzare o rifiutare le richieste dei professionisti.
            </p>
          </div>

          <button
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
            onClick={() => void load()}
            disabled={loading || isPending}
          >
            Aggiorna
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
          Caricamento…
        </div>
      ) : null}

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">In attesa</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Approva l’accesso scegliendo la durata più adatta.
          </p>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Nessuna richiesta in attesa.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => {
              const selectedDuration = durationByRequestId[r.id] ?? "7d";

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-4"
                >
                  <div className="text-sm">
                    <div className="font-semibold text-zinc-900">
                      {r.animal_name ?? r.animal_id} • {r.org_name ?? r.org_id}
                    </div>
                    <div className="mt-1 text-zinc-600">
                      Richiesta del {formatDateTime(r.created_at)}
                    </div>
                    <div className="mt-1 text-zinc-500">
                      Permessi richiesti:{" "}
                      {r.requested_scope?.length ? r.requested_scope.join(", ") : "accesso base"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <label className="block text-sm font-medium text-zinc-900">
                      Durata autorizzazione
                    </label>
                    <select
                      className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                      value={selectedDuration}
                      onChange={(e) =>
                        setDurationByRequestId((prev) => ({
                          ...prev,
                          [r.id]: e.target.value as Duration,
                        }))
                      }
                      disabled={isPending}
                    >
                      <option value="24h">{labelDuration("24h")}</option>
                      <option value="7d">{labelDuration("7d")}</option>
                      <option value="6m">{labelDuration("6m")}</option>
                      <option value="forever">{labelDuration("forever")}</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-60"
                      onClick={() => act(r.id, "reject")}
                      disabled={isPending}
                    >
                      Rifiuta
                    </button>
                    <button
                      className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      onClick={() => act(r.id, "approve")}
                      disabled={isPending}
                    >
                      Approva accesso
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Storico</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Storico delle richieste già gestite.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Nessuno storico.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <div className="font-semibold text-zinc-900">
                    {r.animal_name ?? r.animal_id} • {r.org_name ?? r.org_id}
                  </div>
                  <div className="mt-1 text-zinc-600">
                    Stato: {r.status}
                  </div>
                  <div className="mt-1 text-zinc-500">
                    Data: {formatDateTime(r.created_at)}
                    {r.expires_at ? ` • Scade: ${formatDate(r.expires_at)}` : ""}
                  </div>
                </div>

                {r.status === "approved" ? (
                  <button
                    className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    onClick={() => act(r.id, "revoke")}
                    disabled={isPending}
                  >
                    Revoca accesso
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}