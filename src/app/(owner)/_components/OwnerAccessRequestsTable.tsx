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

function normalizeRequestedScope(scope?: string[] | null) {
  if (!scope?.length) return "accesso base";

  return scope
    .filter((x) => x === "read" || x === "write")
    .map((x) => (x === "read" ? "lettura" : "modifica"))
    .join(", ");
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
    <section className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_10px_28px_rgba(42,56,86,0.05)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold tracking-[-0.02em] text-[#30486f]">
            Richieste di accesso
          </div>
          <div className="mt-1 text-sm leading-7 text-[#5f708a]">
            Gestisci le autorizzazioni dei professionisti per questo animale.
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff] disabled:opacity-60"
          onClick={() => void load()}
          disabled={loading || isPending}
        >
          Aggiorna
        </button>
      </div>

      {err ? (
        <div className="mt-5 rounded-[1.1rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 rounded-[1.25rem] border border-[#e3e9f0] bg-[#fbfdff] p-4 text-sm text-[#5f708a]">
          Caricamento…
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-[#30486f]">In attesa</div>

          {pending.length === 0 ? (
            <div className="rounded-[1.25rem] border border-[#e3e9f0] bg-[#fbfdff] p-4 text-sm text-[#5f708a]">
              Nessuna richiesta in attesa.
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((r) => {
                const selectedDuration = durationByRequestId[r.id] ?? "7d";

                return (
                  <div
                    key={r.id}
                    className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-4 shadow-[0_8px_22px_rgba(42,56,86,0.03)]"
                  >
                    <div className="text-sm">
                      <div className="font-semibold text-[#30486f]">
                        {r.animal_name ?? r.animal_id} • {r.organization_name ?? r.organization_id}
                      </div>

                      <div className="mt-1 text-[#5f708a]">
                        Richiesta del {formatDateTime(r.created_at)}
                      </div>

                      <div className="mt-1 text-[#6f7d91]">
                        Permessi richiesti: {normalizeRequestedScope(r.requested_scope)}
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.25rem] border border-[#e3e9f0] bg-[#f8fbff] p-4">
                      <label className="block text-sm font-semibold text-[#30486f]">
                        Durata autorizzazione
                      </label>

                      <select
                        className="mt-2 w-full rounded-[1.1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f69c7] focus:ring-4 focus:ring-[#2f69c7]/10"
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

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] disabled:opacity-60"
                        onClick={() => act(r.id, "reject")}
                        disabled={isPending}
                      >
                        Rifiuta
                      </button>

                      <button
                        className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] disabled:opacity-60"
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
          <div className="text-sm font-semibold text-[#30486f]">Storico</div>

          {history.length === 0 ? (
            <div className="rounded-[1.25rem] border border-[#e3e9f0] bg-[#fbfdff] p-4 text-sm text-[#5f708a]">
              Nessun elemento.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-4 shadow-[0_8px_22px_rgba(42,56,86,0.03)] sm:flex sm:items-center sm:justify-between"
                >
                  <div className="text-sm">
                    <div className="font-semibold text-[#30486f]">
                      {r.animal_name ?? r.animal_id} • {r.organization_name ?? r.organization_id}
                    </div>

                    <div className="mt-1 text-[#5f708a]">Stato: {r.status}</div>

                    <div className="mt-1 text-[#6f7d91]">
                      Data: {formatDateTime(r.created_at)}
                      {r.expires_at ? ` • Scade: ${formatDate(r.expires_at)}` : ""}
                    </div>
                  </div>

                  {r.status === "approved" ? (
                    <button
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:mt-0"
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
      </div>
    </section>
  );
}