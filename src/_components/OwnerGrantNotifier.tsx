"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  created_at: string;
  animal_id: string;
  organization_id: string;
  status: "pending" | "approved" | "rejected" | "blocked" | "revoked" | string;
  requested_scope?: string[] | null;
  expires_at?: string | null;
  animal_name?: string | null;
  organization_name?: string | null;
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Errore";
}

export default function OwnerAccessRequestsTable({ animalId }: { animalId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [durationByRequestId, setDurationByRequestId] = useState<Record<string, Duration>>({});

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const url = animalId
        ? `/api/owner/access-requests?animalId=${encodeURIComponent(animalId)}`
        : `/api/owner/access-requests`;

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json?.error || "Errore caricamento");
      const nextRows = json.rows ?? [];
      setRows(nextRows);

      setDurationByRequestId((prev) => {
        const next = { ...prev };
        for (const row of nextRows) {
          if (row.status === "pending" && !next[row.id]) next[row.id] = "7d";
        }
        return next;
      });
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
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
        alert(json?.error || "Operazione fallita");
        return;
      }

      await load();
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold text-zinc-900">Richieste di accesso</div>
          <div className="mt-1 text-sm text-zinc-600">
            Gestisci le autorizzazioni dei professionisti per questo animale.
          </div>
        </div>

        <button
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
          onClick={() => void load()}
          disabled={loading || isPending}
        >
          Aggiorna
        </button>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Caricamento…
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="text-sm font-semibold text-zinc-900">In attesa</div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Nessuna richiesta in attesa.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => {
              const selectedDuration = durationByRequestId[r.id] ?? "7d";

              return (
                <div key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-4">
                  <div className="text-sm">
                    <div className="font-semibold text-zinc-900">
                      {r.animal_name ?? r.animal_id} • {r.organization_name ?? r.organization_id}
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
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-zinc-900">Storico</div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Nessun elemento.
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
                    {r.animal_name ?? r.animal_id} • {r.organization_name ?? r.organization_id}
                  </div>
                  <div className="mt-1 text-zinc-600">Stato: {r.status}</div>
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
      </div>
    </section>
  );
}