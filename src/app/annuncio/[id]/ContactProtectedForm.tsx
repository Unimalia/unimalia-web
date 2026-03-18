"use client";

import { useState } from "react";

type Props = {
  reportId: string;
};

export default function ContactProtectedForm({ reportId }: Props) {
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg(null);
    setIsError(false);

    if (!senderEmail.trim() || !message.trim()) {
      setIsError(true);
      setResultMsg("Inserisci email e messaggio.");
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
      setIsError(false);
      setResultMsg("✅ Messaggio inviato correttamente. Il segnalatore riceverà la tua comunicazione.");
    } catch {
      setIsError(true);
      setResultMsg("Errore di rete o server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
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
          className="min-h-[120px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm"
          required
        />
      </label>

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