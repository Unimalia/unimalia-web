"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

type Row = {
  id: string;
  created_at: string;
  animal_id: string;
  owner_id: string;
  org_id: string;
  status: string;
  requested_scope: string[];
  expires_at: string | null;
};

export default function RequestAccessClient({ initialRows }: { initialRows: Row[] }) {
  const sp = useSearchParams();
  const chipFromUrl = sp.get("chip") || "";
  const animalIdFromUrl = sp.get("animalId") || "";

  const [rows, setRows] = React.useState<Row[]>(initialRows);
  const [microchipOrCode, setMicrochipOrCode] = React.useState(chipFromUrl || animalIdFromUrl);
  const [scope, setScope] = React.useState<string[]>(["read"]);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const v = chipFromUrl || animalIdFromUrl;
    if (v) setMicrochipOrCode(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipFromUrl, animalIdFromUrl]);

  function toggleScope(s: string) {
    setScope((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function submit() {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/professionisti/access-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ microchipOrCode, scope }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Errore");
      setRows((prev) => [json.request, ...prev]);
      setMicrochipOrCode("");
      setScope(["read"]);
      setMsg("Richiesta inviata.");
    } catch (e: any) {
      setMsg(e?.message || "Errore");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Richieste accesso</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Nessuna ricerca globale: invia richiesta solo con microchip o codice UNIMALIA.
      </p>

      <div className="mt-6 rounded-xl border bg-white p-4">
        <div className="text-sm font-semibold">Nuova richiesta</div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={microchipOrCode}
            onChange={(e) => setMicrochipOrCode(e.target.value)}
            placeholder="Microchip o codice UNIMALIA (UUID)"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={submit}
            disabled={busy || !microchipOrCode.trim() || scope.length === 0}
            className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
          >
            {busy ? "Invio..." : "Invia"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={scope.includes("read")}
              onChange={() => toggleScope("read")}
            />
            read
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={scope.includes("write")}
              onChange={() => toggleScope("write")}
            />
            write
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={scope.includes("upload")}
              onChange={() => toggleScope("upload")}
            />
            upload
          </label>
        </div>

        {msg && <div className="mt-3 text-sm text-neutral-700">{msg}</div>}
      </div>

      <div className="mt-6 rounded-xl border bg-white overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left">
              <th className="p-3">Data</th>
              <th className="p-3">Animal ID</th>
              <th className="p-3">Stato</th>
              <th className="p-3">Scope</th>
              <th className="p-3">Scadenza</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{new Date(r.created_at).toLocaleString("it-IT")}</td>
                <td className="p-3 font-mono">{r.animal_id}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">{(r.requested_scope ?? []).join(", ")}</td>
                <td className="p-3">
                  {r.expires_at ? new Date(r.expires_at).toLocaleString("it-IT") : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="border-t">
                <td className="p-6 text-neutral-600" colSpan={5}>
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