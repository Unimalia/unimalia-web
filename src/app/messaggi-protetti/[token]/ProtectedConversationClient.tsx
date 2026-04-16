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

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.75rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_10px_28px_rgba(42,56,86,0.05)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
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
      <SectionCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
              Conversazione protetta
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#30486f] sm:text-3xl">
              Messaggi riservati
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#5f708a]">
              Annuncio: <span className="font-semibold text-[#30486f]">{reportTitle}</span>
            </p>

            <p className="mt-2 text-sm leading-7 text-[#5f708a]">
              I contatti personali restano nascosti, a meno che uno dei due non scelga di scriverli
              direttamente nel messaggio.
            </p>
          </div>

          <div className="rounded-[1.2rem] border border-[#e3e9f0] bg-[#fbfdff] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7d91]">
              Stato annuncio
            </p>
            <p className="mt-1 text-sm font-semibold text-[#30486f]">
              {isActive ? "Attivo" : "Non attivo"}
            </p>
          </div>
        </div>

        {!isActive ? (
          <div className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            L’annuncio non è più attivo. La conversazione è in sola lettura.
          </div>
        ) : null}
      </SectionCard>

      <SectionCard className="p-4 sm:p-5">
        <div className="grid gap-3">
          {messages.length === 0 ? (
            <p className="text-sm text-[#5f708a]">Nessun messaggio ancora.</p>
          ) : (
            messages.map((item) => {
              const mine = item.sender_role === viewerRole;

              return (
                <div
                  key={item.id}
                  className={`max-w-[88%] rounded-[1.35rem] px-4 py-3 text-sm shadow-sm ${
                    mine
                      ? "ml-auto bg-[#30486f] text-white"
                      : "border border-[#e3e9f0] bg-[#f8fbff] text-[#30486f]"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-7">{item.message}</p>
                  <p
                    className={`mt-2 text-xs ${
                      mine ? "text-white/70" : "text-[#6f7d91]"
                    }`}
                  >
                    {formatDate(item.created_at)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>

      {isActive ? (
        <SectionCard>
          <form onSubmit={onSubmit}>
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <label className="grid gap-2 text-sm font-semibold text-[#30486f]">
              Rispondi
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Scrivi qui la tua risposta..."
                className="min-h-[150px] w-full rounded-[1.1rem] border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-[#7a8799] focus:border-[#2f69c7] focus:ring-4 focus:ring-[#2f69c7]/10"
              />
            </label>

            <div className="mt-5">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
              >
                {loading ? "Invio..." : "Invia risposta"}
              </button>
            </div>

            {resultMsg ? (
              <div className="mt-4 rounded-[1.1rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {resultMsg}
              </div>
            ) : null}

            {errorMsg ? (
              <div className="mt-4 rounded-[1.1rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMsg}
              </div>
            ) : null}
          </form>
        </SectionCard>
      ) : null}
    </div>
  );
}