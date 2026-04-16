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
      setResultMsg("Scrivi un messaggio un poâ€™ piÃ¹ completo.");
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
        "âœ… Messaggio inviato correttamente. Il segnalatore riceverÃ  la tua comunicazione."
      );
    } catch {
      setIsError(true);
      setResultMsg("Errore di rete o server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="hidden" aria-hidden="true">
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        La tua email
        <input
          type="email"
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
          placeholder="nome@email.it"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Messaggio
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Scrivi qui le informazioni utili da inviare al segnalatore..."
          className="min-h-[140px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm"
          required
        />
      </label>

      <p className="text-xs leading-5 text-zinc-500">
        Il tuo messaggio verrÃ  inoltrato al segnalatore senza mostrare pubblicamente il suo indirizzo email.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-xl bg-black text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Invio..." : "Invia messaggio"}
      </button>

      {resultMsg ? (
        <div
          className={`rounded-xl border p-4 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-zinc-200 bg-white text-zinc-800"
          }`}
        >
          {resultMsg}
        </div>
      ) : null}
    </form>
  );
}