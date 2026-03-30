"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authHeaders } from "@/lib/client/authHeaders";

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
  expires_at: string | null;
  last_message_at?: string | null;
  animal?: {
    id: string;
    name: string | null;
    species: string | null;
    breed: string | null;
    sex: string | null;
    microchip?: string | null;
  } | null;
  events?: Array<{
    id: string;
    title: string | null;
    event_date: string | null;
    created_at: string;
  }>;
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

function boxTitle(box: BoxType) {
  switch (box) {
    case "received":
      return "Consulti ricevuti";
    case "sent":
      return "Consulti inviati";
    case "archive":
      return "Archivio consulti";
    default:
      return "Consulti veterinari";
  }
}

function boxDescription(box: BoxType) {
  switch (box) {
    case "received":
      return "Richieste di consulto ricevute da altre cliniche o professionisti veterinari.";
    case "sent":
      return "Richieste di consulto inviate dalla tua clinica ad altri veterinari o cliniche.";
    case "archive":
      return "Storico dei consulti chiusi, rifiutati o scaduti.";
    default:
      return "Consulti veterinari.";
  }
}

function counterpartLabel(box: BoxType) {
  switch (box) {
    case "received":
      return "Richiesto da";
    case "sent":
      return "Inviato a";
    case "archive":
      return "Controparte";
    default:
      return "Controparte";
  }
}

function counterpartName(item: ConsultItem, box: BoxType) {
  if (box === "received") return item.sender_display_name || "Professionista";
  if (box === "sent") return item.receiver_display_name || "Professionista";
  return `${item.sender_display_name || "Professionista"} → ${item.receiver_display_name || "Professionista"}`;
}

function activityLabel(box: BoxType, status: ConsultItem["status"]) {
  if (box === "received") {
    if (status === "pending") return "Da prendere in carico";
    if (status === "accepted" || status === "replied") return "Consulto attivo";
    return "Ricevuto";
  }

  if (box === "sent") {
    if (status === "pending") return "In attesa di risposta";
    if (status === "accepted" || status === "replied") return "In corso";
    return "Inviato";
  }

  return "Archiviato";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("it-IT");
}

async function fetchConsultItems(box: BoxType) {
  const params = new URLSearchParams();
  params.set("box", box);

  const res = await fetch(`/api/professionisti/consults?${params.toString()}`, {
    cache: "no-store",
    headers: {
      ...(await authHeaders()),
      "x-unimalia-app": "professionisti",
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error || "Errore caricamento consulti");
  }

  return (json.items ?? []) as ConsultItem[];
}

export default function ProfessionistiRichiesteClient() {
  const [box, setBox] = useState<BoxType>("received");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ConsultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [receivedCount, setReceivedCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  const pageTitle = useMemo(() => boxTitle(box), [box]);
  const pageDescription = useMemo(() => boxDescription(box), [box]);

  const refreshCounters = useCallback(async () => {
    try {
      const [receivedItems, sentItems] = await Promise.all([
        fetchConsultItems("received"),
        fetchConsultItems("sent"),
      ]);

      setReceivedCount(receivedItems.length);
      setSentCount(sentItems.length);
    } catch {
      setReceivedCount(0);
      setSentCount(0);
    }
  }, []);

  const load = useCallback(async () => {
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
        headers: {
          ...(await authHeaders()),
          "x-unimalia-app": "professionisti",
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Errore caricamento consulti");
      }

      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }, [box, status, priority, q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void refreshCounters();
  }, [refreshCounters]);

  const filteredItems = useMemo(() => {
    if (!q.trim()) return items;

    const query = q.trim().toLowerCase();

    return items.filter((item) =>
      [
        item.animal_name,
        item.subject,
        item.sender_display_name,
        item.receiver_display_name,
        item.initial_message,
        item.animal?.species,
        item.animal?.breed,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [items, q]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">{pageTitle}</h1>
        <p className="mt-2 text-sm text-zinc-600">{pageDescription}</p>
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
              <span className="inline-flex items-center gap-2">
                <span>Ricevuti</span>
                {receivedCount > 0 ? (
                  <span
                    className={`inline-flex min-w-[1.35rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      box === "received" ? "bg-white text-black" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {receivedCount}
                  </span>
                ) : null}
              </span>
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
              <span className="inline-flex items-center gap-2">
                <span>Inviati</span>
                {sentCount > 0 ? (
                  <span
                    className={`inline-flex min-w-[1.35rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      box === "sent" ? "bg-white text-black" : "bg-zinc-800 text-white"
                    }`}
                  >
                    {sentCount}
                  </span>
                ) : null}
              </span>
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
          onClick={() => {
            void load();
            void refreshCounters();
          }}
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
          onClick={() => {
            void load();
            void refreshCounters();
          }}
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
      ) : filteredItems.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          Nessun consulto trovato.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredItems.map((item) => {
            const counterpart = counterpartName(item, box);
            const activityDate = item.last_message_at || item.created_at;

            const cardClass =
              box === "received"
                ? item.priority === "emergency"
                  ? "border-red-300 bg-red-50 hover:bg-red-50/80"
                  : "border-emerald-300 bg-emerald-50 hover:bg-emerald-50/80"
                : box === "sent"
                  ? item.priority === "emergency"
                    ? "border-red-300 bg-red-50 hover:bg-red-50/80"
                    : "border-blue-200 bg-blue-50 hover:bg-blue-50/80"
                  : "border-zinc-200 bg-white hover:bg-zinc-50";

            return (
              <Link
                key={item.id}
                href={`/professionisti/richieste/${item.id}`}
                className={`block rounded-3xl border p-5 shadow-sm transition ${cardClass}`}
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

                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      box === "received"
                        ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                        : box === "sent"
                          ? "border border-blue-200 bg-blue-100 text-blue-800"
                          : "border border-zinc-200 bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {activityLabel(box, item.status)}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold text-zinc-900">
                      {item.animal_name} — {item.subject}
                    </div>

                    <div className="mt-1 text-sm text-zinc-600">
                      {counterpartLabel(box)} {counterpart}
                    </div>

                    <div className="mt-2 text-sm text-zinc-500">
                      {[item.animal?.species, item.animal?.breed].filter(Boolean).join(" · ") ||
                        "Dati animale non disponibili"}
                    </div>

                    {item.initial_message ? (
                      <div className="mt-2 line-clamp-2 text-sm text-zinc-700">
                        {item.initial_message}
                      </div>
                    ) : null}

                    <div className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
                      Eventi condivisi: {item.events?.length ?? 0}
                    </div>
                  </div>

                  <div className="text-sm text-zinc-500 md:text-right">
                    <div>Aperto: {formatDate(item.created_at)}</div>
                    <div>Ultima attività: {formatDate(activityDate)}</div>
                    <div>Scade: {formatDate(item.expires_at)}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}