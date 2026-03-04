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

export default function OwnerRequestsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [duration, setDuration] = useState<Duration>("forever");

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
      setRows(json.rows ?? []);
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
    startTransition(async () => {
      const res = await fetch("/api/owner/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          duration: action === "approve" ? duration : undefined,
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Richieste accesso</h1>
        <button
          className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
          onClick={() => void load()}
          disabled={loading || isPending}
        >
          Aggiorna
        </button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {loading ? <div className="text-sm opacity-70">Caricamento…</div> : null}

      <section className="rounded-2xl border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">In attesa</div>

          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-70">Durata approvazione:</span>
            <select
              className="rounded-xl border px-3 py-2"
              value={duration}
              onChange={(e) => setDuration(e.target.value as Duration)}
              disabled={isPending}
            >
              <option value="24h">24 ore</option>
              <option value="7d">7 giorni</option>
              <option value="6m">6 mesi</option>
              <option value="forever">Senza scadenza</option>
            </select>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="text-sm opacity-70">Nessuna richiesta pending.</div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border p-3 flex items-center justify-between gap-3"
              >
                <div className="text-sm">
                  <div className="font-medium">
                    {r.animal_name ?? r.animal_id} • {r.org_name ?? r.org_id}
                  </div>
                  <div className="opacity-70">
                    Scope: {r.requested_scope?.length ? r.requested_scope.join(", ") : "—"} •{" "}
                    {new Date(r.created_at).toLocaleString("it-IT")}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
                    onClick={() => act(r.id, "reject")}
                    disabled={isPending}
                  >
                    Rifiuta
                  </button>
                  <button
                    className="rounded-xl bg-black text-white px-3 py-2 text-sm disabled:opacity-60"
                    onClick={() => act(r.id, "approve")}
                    disabled={isPending}
                  >
                    Approva
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border p-4 space-y-3">
        <div className="font-medium">Storico</div>

        {history.length === 0 ? (
          <div className="text-sm opacity-70">Nessuno storico.</div>
        ) : (
          <div className="space-y-2">
            {history.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border p-3 flex items-center justify-between gap-3"
              >
                <div className="text-sm">
                  <div className="font-medium">
                    {r.animal_name ?? r.animal_id} • {r.org_name ?? r.org_id}
                  </div>
                  <div className="opacity-70">
                    Stato: {r.status} • {new Date(r.created_at).toLocaleString("it-IT")}
                    {r.expires_at ? ` • Scade: ${new Date(r.expires_at).toLocaleDateString("it-IT")}` : ""}
                  </div>
                </div>

                {r.status === "approved" ? (
                  <button
                    className="rounded-xl bg-red-600 text-white px-3 py-2 text-sm disabled:opacity-60"
                    onClick={() => act(r.id, "revoke")}
                    disabled={isPending}
                  >
                    Revoca
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