"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AccessRequest = {
  id: string;
  animal_id: string;
  owner_id?: string;
  org_id: string;
  status: "pending" | "approved" | "rejected" | "blocked" | "revoked" | string;
  created_at: string;
  requested_scope?: string[] | null; // nel tuo schema è requested_scope
  expires_at?: string | null;
};

type AccessGrant = {
  id: string;
  animal_id: string;
  grantee_type: string; // "org"
  grantee_id: string; // org_id
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
  if (g.scope_read) parts.push("read");
  if (g.scope_write) parts.push("write");
  if (g.scope_upload) parts.push("upload");
  return parts.length ? parts.join(", ") : "—";
}

function labelDuration(d: Duration) {
  if (d === "24h") return "24 ore";
  if (d === "7d") return "7 giorni";
  if (d === "6m") return "6 mesi";
  return "Senza scadenza";
}

export default function OwnerAccessiProfessionisti({ animalId }: { animalId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [error, setError] = useState<string | null>(null);

  // durata selezionata per richiesta
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

      // inizializza default 7d per pending non ancora presenti nello state
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          duration, // "24h" | "7d" | "6m" | "forever"
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
        alert(json?.error || "Errore revoca grant");
        return;
      }

      await load();
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Accessi professionisti</h2>

        <button
          className="rounded-xl border px-3 py-1 text-sm disabled:opacity-60"
          onClick={load}
          disabled={loading || isPending}
        >
          Aggiorna
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm opacity-70">Caricamento…</p> : null}

      {/* GRANT ATTIVI */}
      <div className="space-y-2">
        <h3 className="font-medium">Grant attivi</h3>

        {activeGrants.length === 0 ? (
          <p className="text-sm opacity-70">Nessun grant attivo.</p>
        ) : (
          <ul className="space-y-2">
            {activeGrants.map((g) => (
              <li
                key={g.id}
                className="rounded-xl border p-3 flex items-center justify-between gap-3"
              >
                <div className="text-sm">
                  <div className="font-medium">
                    Org {g.grantee_id} • {formatScopeFromGrant(g)}
                  </div>
                  <div className="opacity-70">
                    Scadenza: {g.valid_to ? new Date(g.valid_to).toLocaleDateString("it-IT") : "—"}
                  </div>
                </div>

                <button
                  className="rounded-xl bg-red-600 text-white px-3 py-2 text-sm disabled:opacity-60"
                  onClick={() => revokeGrant(g.id)}
                  disabled={isPending}
                >
                  Revoca
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* RICHIESTE */}
      <div className="space-y-2">
        <h3 className="font-medium">Richieste</h3>

        {pendingRequests.length === 0 ? (
          <p className="text-sm opacity-70">Nessuna richiesta in attesa.</p>
        ) : (
          <ul className="space-y-2">
            {pendingRequests.map((r) => {
              const duration = durationByRequestId[r.id] ?? "7d";

              return (
                <li
                  key={r.id}
                  className="rounded-xl border p-3 flex items-center justify-between gap-3"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      Org {r.org_id} •{" "}
                      {r.requested_scope?.length ? r.requested_scope.join(", ") : "—"}
                    </div>
                    <div className="opacity-70">
                      Stato: {r.status} • {new Date(r.created_at).toLocaleString("it-IT")}
                    </div>

                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs opacity-70">Durata accesso:</span>
                      <select
                        className="rounded-xl border px-2 py-1 text-sm"
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
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
                      onClick={() => rejectRequest(r.id)}
                      disabled={isPending}
                    >
                      Rifiuta
                    </button>
                    <button
                      className="rounded-xl bg-black text-white px-3 py-2 text-sm disabled:opacity-60"
                      onClick={() => approveRequest(r.id)}
                      disabled={isPending}
                      title={`Approva (${labelDuration(duration)})`}
                    >
                      Approva
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {historyRequests.length > 0 ? (
          <details className="rounded-xl border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Storico (approved / rejected / blocked / revoked)
            </summary>
            <ul className="mt-3 space-y-2">
              {historyRequests.map((r) => (
                <li key={r.id} className="rounded-xl border p-3">
                  <div className="text-sm font-medium">
                    Org {r.org_id} •{" "}
                    {r.requested_scope?.length ? r.requested_scope.join(", ") : "—"}
                  </div>
                  <div className="text-sm opacity-70">
                    Stato: {r.status} • {new Date(r.created_at).toLocaleString("it-IT")}
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