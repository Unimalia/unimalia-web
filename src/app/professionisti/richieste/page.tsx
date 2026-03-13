"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BoxType = "received" | "sent" | "archive";

type ConsultItem = {
  id: string;
  animal_name: string;
  sender_display_name: string;
  receiver_display_name: string;
  subject: string;
  initial_message: string | null;
  share_mode: "full_record" | "selected_events";
  priority: "normal" | "emergency";
  status: "pending" | "accepted" | "replied" | "closed" | "rejected" | "expired";
  created_at: string;
  expires_at: string;
};

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "In attesa";
    case "accepted":
      return "Accettato";
    case "replied":
      return "Con risposta";
    case "closed":
      return "Chiuso";
    case "rejected":
      return "Rifiutato";
    case "expired":
      return "Scaduto";
    default:
      return status;
  }
}

function shareModeLabel(mode: string) {
  return mode === "full_record" ? "Cartella completa" : "Eventi selezionati";
}

export default function ProfessionistiRichiestePage() {
  const [box, setBox] = useState<BoxType>("received");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ConsultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("box", box);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/professionisti/consults?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Errore caricamento consulti");
      setItems(json.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [box, status, priority]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Consulti veterinari</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Inbox clinica interna tra professionisti UNIMALIA.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBox("received")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                box === "received"
                  ? "bg-black text-white"
                  : "border border-zinc-200 bg-white text-zinc-800"
              }`}
            >
              Ricevute
            </button>

            <button
              type="button"
              onClick={() => setBox("sent")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                box === "sent"
                  ? "bg-black text-white"
                  : "border border-zinc-200 bg-white text-zinc-800"
              }`}
            >
              Inviate
            </button>

            <button
              type="button"
              onClick={() => setBox("archive")}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                box === "archive"
                  ? "bg-black text-white"
                  : "border border-zinc-200 bg-white text-zinc-800"
              }`}
            >
              Archivio
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
        >
          Aggiorna
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca consulto..."
          className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        >
          <option value="">Tutti gli stati</option>
          <option value="pending">In attesa</option>
          <option value="accepted">Accettati</option>
          <option value="replied">Con risposta</option>
          <option value="closed">Chiusi</option>
          <option value="rejected">Rifiutati</option>
          <option value="expired">Scaduti</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        >
          <option value="">Tutte le priorità</option>
          <option value="normal">Normale</option>
          <option value="emergency">Emergenza</option>
        </select>

        <button
          type="button"
          onClick={load}
          className="h-11 rounded-2xl bg-black px-4 text-sm font-semibold text-white"
        >
          Cerca
        </button>
      </div>

      {loading ? (
        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          Caricamento...
        </div>
      ) : error ? (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          Nessun consulto trovato.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/professionisti/richieste/${item.id}`}
              className={`block rounded-3xl border p-5 shadow-sm transition hover:bg-zinc-50 ${
                item.priority === "emergency"
                  ? "border-red-300 bg-red-50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {item.priority === "emergency" ? (
                  <span className="rounded-full border border-red-200 bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                    EMERGENZA
                  </span>
                ) : null}

                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">
                  {statusLabel(item.status)}
                </span>

                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">
                  {shareModeLabel(item.share_mode)}
                </span>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-zinc-900">
                    {item.animal_name} — {item.subject}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {box === "sent" ? "A" : "Da"}{" "}
                    {box === "sent" ? item.receiver_display_name : item.sender_display_name}
                  </div>
                  {item.initial_message ? (
                    <div className="mt-2 line-clamp-2 text-sm text-zinc-700">
                      {item.initial_message}
                    </div>
                  ) : null}
                </div>

                <div className="text-sm text-zinc-500 md:text-right">
                  <div>{new Date(item.created_at).toLocaleString("it-IT")}</div>
                  <div>Scade: {new Date(item.expires_at).toLocaleString("it-IT")}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}