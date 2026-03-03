"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  created_at: string;
  animal_id: string;
  org_id: string;
  status: string;
  requested_scope?: string[] | null;
  expires_at?: string | null;

  // se li aggiungi via API (consigliato)
  animal_name?: string | null;
  org_name?: string | null;
};

export default function OwnerAccessRequestsTable({ animalId }: { animalId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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
      setRows(json.rows ?? []);
    } catch (e: any) {
      setErr(e?.message || "Errore");
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
          duration: "forever", // puoi cambiarlo dopo in UI
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
    <section className="rounded-2xl border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">Richieste accesso</div>
        <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => void load()} disabled={loading || isPending}>
          Aggiorna
        </button>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}
      {loading ? <div className="text-sm opacity-70">Caricamento…</div> : null}

      {/* Pending */}
      <div className="space-y-2">
        <div className="text-sm font-medium">In attesa</div>
        {pending.length === 0 ? (
          <div className="text-sm opacity-70">Nessuna richiesta pending.</div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {r.animal_name ?? r.animal_id} • {r.org_name ?? r.org_id}
                  </div>
                  <div className="opacity-70">
                    Scope: {(r.requested_scope?.length ? r.requested_scope.join(", ") : "—")} •{" "}
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
      </div>

      {/* Storico */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Storico</div>
        {history.length === 0 ? (
          <div className="text-sm opacity-70">Nessun elemento.</div>
        ) : (
          <div className="space-y-2">
            {history.map((r) => (
              <div key={r.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {r.animal_name ?? r.animal_id} • {r.org_name ?? r.org_id}
                  </div>
                  <div className="opacity-70">
                    Stato: {r.status} • {new Date(r.created_at).toLocaleString("it-IT")}
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
      </div>
    </section>
  );
}