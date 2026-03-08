"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AccessRequest = {
  id: string;
  animal_id: string;
  owner_id?: string;
  org_id: string;
  org_name?: string | null;
  animal_name?: string | null;
  status: "pending" | "approved" | "rejected" | "blocked" | "revoked" | string;
  created_at: string;
  requested_scope?: string[] | null;
  expires_at?: string | null;
};

type AccessGrant = {
  id: string;
  animal_id: string;
  grantee_type: string;
  grantee_id: string;
  org_name?: string | null;
  animal_name?: string | null;
  status: "active" | "revoked" | string;
  valid_to: string | null;
  revoked_at: string | null;
  created_at: string;
  scope_read?: boolean;
  scope_write?: boolean;
  scope_upload?: boolean;
};

type Duration = "24h" | "7d" | "6m" | "forever";

function formatScopeFromGrant(g: AccessGrant) {
  const parts: string[] = [];
  if (g.scope_read) parts.push("lettura");
  if (g.scope_write) parts.push("modifica");
  return parts.length ? parts.join(", ") : "accesso base";
}

function formatRequestedScope(scope?: string[] | null) {
  if (!scope?.length) return "accesso base";

  return scope
    .map((item) => {
      if (item === "read") return "lettura";
      if (item === "write") return "modifica";
      return item;
    })
    .join(", ");
}

function labelDuration(d: Duration) {
  if (d === "24h") return "24 ore";
  if (d === "7d") return "7 giorni";
  if (d === "6m") return "6 mesi";
  return "Senza scadenza";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("it-IT");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Senza scadenza";
  return new Date(value).toLocaleDateString("it-IT");
}

function formatOrgLabel(name?: string | null, fallbackId?: string | null) {
  return name?.trim() || fallbackId || "Professionista";
}

export default function OwnerAccessiProfessionisti({ animalId }: { animalId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [durationByRequestId, setDurationByRequestId] = useState<Record<string, Duration>>({});

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/owner/animals/${animalId}/access`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Errore caricamento accessi");

      const nextReqs: AccessRequest[] = json.requests || [];
      setRequests(nextReqs);
      setGrants(json.grants || []);

      setDurationByRequestId((prev) => {
        const next = { ...prev };
        for (const r of nextReqs) {
          if (r.status === "pending" && !next[r.id]) next[r.id] = "7d";
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
  }, [animalId]);

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);

  const historyRequests = useMemo(
    () => requests.filter((r) => r.status !== "pending"),
    [requests]
  );

  const activeGrants = useMemo(
    () => grants.filter((g) => !g.revoked_at && g.status === "active"),
    [grants]
  );

  async function approveRequest(requestId: string) {
    const duration = durationByRequestId[requestId] ?? "7d";

    startTransition(async () => {
      const res = await fetch(`/api/owner/access-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          action: "approve",
          duration,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "Errore approvazione");
        return;
      }

      await load();
      router.refresh();
    });
  }

  async function rejectRequest(requestId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/owner/access-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          action: "reject",
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "Errore rifiuto");
        return;
      }

      await load();
      router.refresh();
    });
  }

  async function revokeGrant(grantId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/owner/grants/${grantId}/revoke`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "Errore revoca accesso");
        return;
      }

      await load();
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Accessi professionisti</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Qui puoi approvare, rifiutare o revocare l’accesso dei professionisti a questo animale.
          </p>
        </div>

        <button
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
          onClick={load}
          disabled={loading || isPending}
        >
          Aggiorna
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Caricamento…
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-900">Accessi attivi</h3>

        {activeGrants.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Nessun accesso attivo.
          </div>
        ) : (
          <ul className="space-y-3">
            {activeGrants.map((g) => (
              <li
                key={g.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <div className="font-semibold text-zinc-900">
                    {formatOrgLabel(g.org_name, g.grantee_id)}
                  </div>
                  <div className="mt-1 text-zinc-600">
                    Permessi: {formatScopeFromGrant(g)}
                  </div>
                  <div className="mt-1 text-zinc-500">
                    Scadenza: {formatDate(g.valid_to)}
                  </div>
                </div>

                <button
                  className="rounded-2xl bg-red-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  onClick={() => revokeGrant(g.id)}
                  disabled={isPending}
                >
                  Revoca accesso
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-900">Richieste in attesa</h3>

        {pendingRequests.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Nessuna richiesta in attesa.
          </div>
        ) : (
          <ul className="space-y-3">
            {pendingRequests.map((r) => {
              const duration = durationByRequestId[r.id] ?? "7d";

              return (
                <li
                  key={r.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-4"
                >
                  <div className="text-sm">
                    <div className="font-semibold text-zinc-900">
                      {formatOrgLabel(r.org_name, r.org_id)}
                    </div>
                    <div className="mt-1 text-zinc-600">
                      Richiesta del {formatDateTime(r.created_at)}
                    </div>
                    <div className="mt-1 text-zinc-500">
                      Permessi richiesti: {formatRequestedScope(r.requested_scope)}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <label className="block text-sm font-medium text-zinc-900">
                      Durata autorizzazione
                    </label>
                    <select
                      className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                      value={duration}
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
                      onClick={() => rejectRequest(r.id)}
                      disabled={isPending}
                    >
                      Rifiuta
                    </button>
                    <button
                      className="rounded-2xl bg-black text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                      onClick={() => approveRequest(r.id)}
                      disabled={isPending}
                    >
                      Approva accesso
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {historyRequests.length > 0 ? (
          <details className="rounded-2xl border border-zinc-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
              Storico richieste
            </summary>

            <ul className="mt-4 space-y-3">
              {historyRequests.map((r) => (
                <li key={r.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-sm font-semibold text-zinc-900">
                    {formatOrgLabel(r.org_name, r.org_id)}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">Stato: {r.status}</div>
                  <div className="mt-1 text-sm text-zinc-500">
                    Data: {formatDateTime(r.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  );
}