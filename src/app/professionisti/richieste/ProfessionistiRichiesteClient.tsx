"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BoxType = "received" | "responses" | "waiting" | "archive";

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
  last_message_at?: string;
  last_message_preview?: string | null;
  last_message_sender_display_name?: string | null;
  needs_my_action?: boolean;
  inbox_bucket?: BoxType;
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
      return "Richieste ricevute";
    case "responses":
      return "Risposte ricevute";
    case "waiting":
      return "In attesa";
    case "archive":
      return "Archivio consulti";
    default:
      return "Consulti veterinari";
  }
}

function counterpartName(item: ConsultItem, box: BoxType) {
  if (box === "received") return item.sender_display_name;
  if (box === "responses") return item.last_message_sender_display_name || item.receiver_display_name;
  if (box === "waiting") return item.receiver_display_name;
  return `${item.sender_display_name} → ${item.receiver_display_name}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("it-IT");
}

export default function ProfessionistiRichiesteClient() {
  const [box, setBox] = useState<BoxType>("received");
  const [items, setItems] = useState<ConsultItem[]>([]);
  const [loading, setLoading] = useState(true);

  const pageTitle = useMemo(() => boxTitle(box), [box]);

  async function load() {
    setLoading(true);

    const params = new URLSearchParams();
    params.set("box", box);

    const res = await fetch(`/api/professionisti/consults?${params.toString()}`, {
      cache: "no-store",
    });

    const json = await res.json();
    setItems(json.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [box]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">{pageTitle}</h1>
      </div>

      {/* TABS */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { key: "received", label: "Da gestire" },
          { key: "responses", label: "Risposte" },
          { key: "waiting", label: "In attesa" },
          { key: "archive", label: "Archivio" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setBox(tab.key as BoxType)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
              box === tab.key
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="mt-6">Caricamento...</div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => {
            const activityDate = item.last_message_at || item.created_at;
            const preview = item.last_message_preview || item.initial_message || "";
            const counterpart = counterpartName(item, box);

            const highlight =
              item.needs_my_action
                ? "border-emerald-400 bg-emerald-50"
                : box === "responses"
                ? "border-blue-300 bg-blue-50"
                : "border-zinc-200 bg-white";

            return (
              <Link
                key={item.id}
                href={`/professionisti/richieste/${item.id}`}
                className={`block rounded-3xl border p-5 shadow-sm hover:bg-zinc-50 ${highlight}`}
              >
                {/* HEADER */}
                <div className="flex flex-wrap items-center gap-2">
                  {item.priority === "emergency" && (
                    <span className="text-xs font-bold text-red-600">EMERGENZA</span>
                  )}

                  {item.needs_my_action && (
                    <span className="text-xs font-bold text-emerald-700">
                      AZIONE RICHIESTA
                    </span>
                  )}

                  {box === "responses" && (
                    <span className="text-xs font-bold text-blue-700">
                      NUOVA RISPOSTA
                    </span>
                  )}
                </div>

                {/* TITOLO */}
                <div className="mt-2 text-lg font-semibold text-zinc-900">
                  {item.animal_name} — {item.subject}
                </div>

                {/* CONTROPARTE */}
                <div className="text-sm text-zinc-600 mt-1">
                  {counterpart}
                </div>

                {/* ULTIMO MESSAGGIO */}
                {item.last_message_sender_display_name && (
                  <div className="mt-2 text-xs text-zinc-500">
                    Ultimo messaggio da: {item.last_message_sender_display_name}
                  </div>
                )}

                {/* PREVIEW */}
                {preview && (
                  <div className="mt-2 text-sm text-zinc-800 line-clamp-2">
                    {preview}
                  </div>
                )}

                {/* FOOTER */}
                <div className="mt-3 text-xs text-zinc-500 flex justify-between">
                  <span>{statusLabel(item.status)}</span>
                  <span>{formatDate(activityDate)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}