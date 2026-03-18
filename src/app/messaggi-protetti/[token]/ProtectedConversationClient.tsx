"use client";

import { useState } from "react";

type Message = {
  id: string;
  sender_role: "owner" | "requester";
  message: string;
  created_at: string;
};

type Props = {
  token: string;
  viewerRole: "owner" | "requester";
  reportTitle: string;
  reportStatus: string;
  messages: Message[];
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("it-IT");
}

export default function ProtectedConversationClient({
  token,
  viewerRole,
  reportTitle,
  reportStatus,
  messages: initialMessages,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isActive = reportStatus === "active";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg(null);
    setErrorMsg(null);

    if (honeypot.trim()) {
      setErrorMsg("Invio non valido.");
      return;
    }

    if (!message.trim()) {
      setErrorMsg("Scrivi un messaggio.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reports/conversation-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message: message.trim(), website: honeypot }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data?.error || "Errore invio risposta.");
        return;
      }

      const newMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_role: viewerRole,
        message: message.trim(),
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
      setResultMsg("✅ Risposta inviata.");
    } catch {
      setErrorMsg("Errore di rete o server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Conversazione protetta
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Annuncio: <span className="font-semibold text-zinc-800">{reportTitle}</span>
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          I contatti personali restano nascosti, a meno che uno dei due non scelga di scriverli nel messaggio.
        </p>

        {!isActive ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            L’annuncio non è più attivo. La conversazione è in sola lettura.
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-600">Nessun messaggio ancora.</p>
          ) : (
            messages.map((item) => {
              const mine = item.sender_role === viewerRole;

              return (
                <div
                  key={item.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    mine
                      ? "ml-auto bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{item.message}</p>
                  <p
                    className={`mt-2 text-xs ${
                      mine ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    {formatDate(item.created_at)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isActive ? (
        <form onSubmit={onSubmit} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            Rispondi
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrivi qui la tua risposta..."
              className="min-h-[140px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm"
            />
          </label>

          <div className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Invio..." : "Invia risposta"}
            </button>
          </div>

          {resultMsg ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {resultMsg}
            </div>
          ) : null}

          {errorMsg ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMsg}
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}