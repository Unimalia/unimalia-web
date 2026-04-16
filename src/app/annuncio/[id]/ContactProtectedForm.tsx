"use client";

import { useState } from "react";

type Props = {
  reportId: string;
};

export default function ContactProtectedForm({ reportId }: Props) {
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg(null);
    setIsError(false);

    if (honeypot.trim()) {
      setIsError(true);
      setResultMsg("Invio non valido.");
      return;
    }

    if (!senderEmail.trim() || !message.trim()) {
      setIsError(true);
      setResultMsg("Inserisci email e messaggio.");
      return;
    }

    if (message.trim().length < 10) {
      setIsError(true);
      setResultMsg("Scrivi un messaggio un po’ più completo.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reports/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: reportId,
          sender_email: senderEmail.trim(),
          message: message.trim(),
          website: honeypot,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIsError(true);
        setResultMsg(data?.error || "Errore invio messaggio.");
        return;
      }

      setSenderEmail("");
      setMessage("");
      setHoneypot("");
      setIsError(false);
      setResultMsg(
        "✅ Messaggio inviato correttamente. Il segnalatore riceverà la tua comunicazione."
      );
    } catch {
      setIsError(true);
      setResultMsg("Errore di rete o server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="hidden" aria-hidden="true">
        <label className="grid gap-2 text-sm font-semibold text-[#30486f]">
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="h-12 w-full rounded-[18px] border border-[#d7e0ea] bg-white px-4 text-sm"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#30486f]">La tua email</span>
        <input
          type="email"
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
          placeholder="nome@email.it"
          className="h-12 w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 text-sm text-[#30486f] outline-none transition placeholder:text-[#7a8799] focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#30486f]">Messaggio</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Scrivi qui le informazioni utili da inviare al segnalatore..."
          className="min-h-[150px] w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 py-3 text-sm text-[#30486f] outline-none transition placeholder:text-[#7a8799] focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
          required
        />
      </label>

      <div className="rounded-[20px] border border-[#e3e9f0] bg-[#f8fbff] p-4">
        <p className="text-xs leading-6 text-[#5f708a]">
          Il tuo messaggio verrà inoltrato al segnalatore senza mostrare pubblicamente il suo
          indirizzo email.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-12 rounded-full bg-[#30486f] text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
      >
        {loading ? "Invio..." : "Invia messaggio"}
      </button>

      {resultMsg ? (
        <div
          className={`rounded-[20px] border p-4 text-sm leading-7 ${
            isError
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-[#e3e9f0] bg-white text-[#30486f]"
          }`}
        >
          {resultMsg}
        </div>
      ) : null}
    </form>
  );
}