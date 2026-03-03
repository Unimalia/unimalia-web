"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

type Row = {
  id: string;
  created_at: string;
  animal_id: string;
  org_id: string;
  status: string;
  requested_scope: string[];
};

export default function OwnerRequestsClient({ initialRows }: { initialRows: Row[] }) {
  const sp = useSearchParams();
  const animalId = sp.get("animalId") || "";

  const [rows, setRows] = React.useState<Row[]>(initialRows);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const url = animalId
          ? `/api/owner/access-requests?animalId=${encodeURIComponent(animalId)}`
          : "/api/owner/access-requests";

        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Errore caricamento richieste");

        if (!alive) return;
        setRows((json?.rows as Row[]) ?? []);
      } catch (e: any) {
        if (!alive) return;
        setMsg(e?.message || "Errore");
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [animalId]);

  async function act(id: string, action: "approve" | "reject" | "block", duration?: string) {
    setMsg(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/owner/access-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action, duration }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Errore");

      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: json.status } : r)));
      setMsg("Operazione completata.");
    } catch (e: any) {
      setMsg(e?.message || "Errore");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Richieste accesso</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Approva con durata. Tutto è revocabile e tracciato.
      </p>

      {msg && <div className="mt-4 text-sm text-neutral-700">{msg}</div>}

      <div className="mt-6 rounded-xl border bg-white overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left">
              <th className="p-3">Data</th>
              <th className="p-3">Animale</th>
              <th className="p-3">Org</th>
              <th className="p-3">Scope</th>
              <th className="p-3">Stato</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{new Date(r.created_at).toLocaleString("it-IT")}</td>
                <td className="p-3 font-mono">{r.animal_id}</td>
                <td className="p-3 font-mono">{r.org_id}</td>
                <td className="p-3">{(r.requested_scope ?? []).join(", ")}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  {r.status === "pending" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-md border px-3 py-1.5 hover:bg-neutral-50"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, "approve", "24h")}
                      >
                        Approva 24h
                      </button>
                      <button
                        className="rounded-md border px-3 py-1.5 hover:bg-neutral-50"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, "approve", "7d")}
                      >
                        7gg
                      </button>
                      <button
                        className="rounded-md border px-3 py-1.5 hover:bg-neutral-50"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, "approve", "6m")}
                      >
                        6 mesi
                      </button>
                      <button
                        className="rounded-md border px-3 py-1.5 hover:bg-neutral-50"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, "approve", "forever")}
                      >
                        Sempre
                      </button>
                      <button
                        className="rounded-md border px-3 py-1.5 hover:bg-neutral-50"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, "reject")}
                      >
                        Rifiuta
                      </button>
                      <button
                        className="rounded-md border px-3 py-1.5 hover:bg-neutral-50"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, "block")}
                      >
                        Blocca org
                      </button>
                    </div>
                  ) : (
                    <span className="text-neutral-600">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="border-t">
                <td className="p-6 text-neutral-600" colSpan={6}>
                  Nessuna richiesta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}