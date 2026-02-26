"use client";

import React, { useEffect, useState } from "react";

type Reminder = {
  id: string;
  animal_id: string;
  type: string;
  title: string;
  due_date: string;
  status: string;
  created_at: string;
};

export default function RemindersSection({ animalId }: { animalId: string }) {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState("vaccino");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reminders/list?animalId=${encodeURIComponent(animalId)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      setItems(json.reminders ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId]);

  async function createReminder() {
    if (!title.trim() || !dueDate) return;

    const res = await fetch("/api/reminders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animalId,
        type,
        title: title.trim(),
        dueDate, // yyyy-mm-dd va bene se colonna date; se timestamptz meglio ISO completo
      }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Errore creazione promemoria");
      return;
    }

    setTitle("");
    setDueDate("");
    await load();
  }

  async function cancelReminder(id: string) {
    const res = await fetch("/api/reminders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Errore annullamento");
      return;
    }

    await load();
  }

  return (
    <section className="rounded-2xl border p-4 space-y-4">
      <div className="text-base font-semibold">Promemoria</div>

      <div className="grid gap-2 md:grid-cols-3">
        <select
          className="rounded-xl border px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="vaccino">Vaccino</option>
          <option value="visita">Visita</option>
          <option value="esame">Esame</option>
        </select>

        <input
          className="rounded-xl border px-3 py-2 md:col-span-2"
          placeholder="Titolo (es. Richiamo trivalente)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <input
          className="rounded-xl border px-3 py-2"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button className="rounded-xl border px-3 py-2" onClick={() => void createReminder()}>
          Aggiungi
        </button>
        <button className="rounded-xl border px-3 py-2" onClick={() => void load()}>
          Aggiorna
        </button>
      </div>

      <div className="space-y-2">
        {loading && <div className="text-sm opacity-70">Caricamento...</div>}

        {!loading && items.length === 0 && (
          <div className="text-sm opacity-70">Nessun promemoria attivo.</div>
        )}

        {!loading &&
          items.map((r) => (
            <div key={r.id} className="rounded-xl border p-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium">
                  {r.type.toUpperCase()} — {r.title}
                </div>
                <div className="text-xs opacity-70">Scadenza: {String(r.due_date).slice(0, 10)}</div>
              </div>

              <button
                className="rounded-xl border px-3 py-2 text-sm"
                onClick={() => void cancelReminder(r.id)}
              >
                Annulla
              </button>
            </div>
          ))}
      </div>
    </section>
  );
}