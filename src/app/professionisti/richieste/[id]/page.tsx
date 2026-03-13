"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ConsultDetail = {
  consult: {
    id: string;
    animal_name: string;
    sender_display_name: string;
    receiver_display_name: string;
    sender_professional_id: string;
    receiver_professional_id: string;
    subject: string;
    initial_message: string | null;
    share_mode: "full_record" | "selected_events";
    priority: "normal" | "emergency";
    status: "pending" | "accepted" | "replied" | "closed" | "rejected" | "expired";
    created_at: string;
    expires_at: string;
  };
  currentProfessionalId: string;
  messages: Array<{
    id: string;
    sender_professional_id: string;
    sender_display_name: string;
    message_type: string;
    message: string;
    created_at: string;
  }>;
  events: Array<{
    id: string;
    event_date: string | null;
    type: string | null;
    title: string | null;
    description: string | null;
    visibility: string | null;
    status: string | null;
    priority: string | null;
    files: Array<{
      id: string;
      filename: string | null;
      path: string | null;
      mime: string | null;
      size: number | null;
    }>;
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

export default function ProfessionistiRichiestaDettaglioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<ConsultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/professionisti/consults/${params.id}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Errore caricamento consulto");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  const canAcceptReject = useMemo(() => {
    if (!data) return false;
    return (
      data.consult.receiver_professional_id === data.currentProfessionalId &&
      data.consult.status === "pending"
    );
  }, [data]);

  const canReply = useMemo(() => {
    if (!data) return false;
    return ["accepted", "replied"].includes(data.consult.status);
  }, [data]);

  const canClose = useMemo(() => {
    if (!data) return false;
    return ["accepted", "replied"].includes(data.consult.status);
  }, [data]);

  async function runAction(action: "accept" | "reject" | "close") {
    try {
      setSaving(true);

      const res = await fetch(`/api/professionisti/consults/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore aggiornamento consulto");

      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setSaving(false);
    }
  }

  async function sendReply() {
    try {
      setSaving(true);

      const res = await fetch(`/api/professionisti/consults/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", message: reply }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore invio risposta");

      setReply("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-6xl p-6">Caricamento...</main>;
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error || "Consulto non disponibile"}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <button
        type="button"
        onClick={() => router.push("/professionisti/richieste")}
        className="mb-4 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
      >
        ← Torna ai consulti
      </button>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {data.consult.priority === "emergency" ? (
            <span className="rounded-full border border-red-200 bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
              EMERGENZA
            </span>
          ) : null}

          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">
            {statusLabel(data.consult.status)}
          </span>

          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">
            {data.consult.share_mode === "full_record" ? "Cartella completa" : "Eventi selezionati"}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">
          {data.consult.animal_name} — {data.consult.subject}
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Da {data.consult.sender_display_name} a {data.consult.receiver_display_name}
        </p>

        <p className="mt-2 text-sm text-zinc-500">
          Creato il {new Date(data.consult.created_at).toLocaleString("it-IT")} · Scade il{" "}
          {new Date(data.consult.expires_at).toLocaleString("it-IT")}
        </p>
      </div>

      {canAcceptReject ? (
        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Azioni</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAction("accept")}
              disabled={saving}
              className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Accetta consulto
            </button>

            <button
              type="button"
              onClick={() => runAction("reject")}
              disabled={saving}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 disabled:opacity-60"
            >
              Rifiuta
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Messaggi / referto</h2>

          <div className="mt-4 space-y-3">
            {data.messages.map((msg) => {
              const mine = msg.sender_professional_id === data.currentProfessionalId;
              return (
                <div
                  key={msg.id}
                  className={`rounded-2xl p-4 ${
                    mine ? "bg-zinc-100" : "bg-blue-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-zinc-900">
                      {msg.sender_display_name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(msg.created_at).toLocaleString("it-IT")}
                    </div>
                  </div>

                  <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                    {msg.message_type}
                  </div>

                  <div className="mt-3 whitespace-pre-wrap text-sm text-zinc-800">
                    {msg.message}
                  </div>
                </div>
              );
            })}
          </div>

          {canReply ? (
            <div className="mt-6 border-t border-zinc-200 pt-6">
              <label className="mb-2 block text-sm font-semibold text-zinc-900">
                Invia risposta / referto
              </label>

              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
                placeholder="Scrivi il tuo referto o la risposta..."
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={saving}
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Invia risposta
                </button>

                {canClose ? (
                  <button
                    type="button"
                    onClick={() => runAction("close")}
                    disabled={saving}
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 disabled:opacity-60"
                  >
                    Chiudi consulto
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Eventi condivisi</h2>

          <div className="mt-4 space-y-3">
            {data.events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-600">
                Nessun evento condiviso.
              </div>
            ) : (
              data.events.map((event) => (
                <div key={event.id} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="text-sm font-semibold text-zinc-900">
                    {event.title || "Evento clinico"}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {event.event_date
                      ? new Date(event.event_date).toLocaleString("it-IT")
                      : "Data non disponibile"}
                  </div>

                  {event.description ? (
                    <div className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">
                      {event.description}
                    </div>
                  ) : null}

                  {event.files.length > 0 ? (
                    <div className="mt-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Allegati
                      </div>
                      <div className="space-y-2">
                        {event.files.map((file) => (
                          <div
                            key={file.id}
                            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
                          >
                            {file.filename || "File allegato"}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}