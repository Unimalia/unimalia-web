"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type LostEvent = {
  id: string;
  created_at: string;
  reporter_id: string;
  species: string;
  animal_name: string | null;
  description: string;
  city: string;
  province: string;
  lost_date: string;
  primary_photo_url: string;
  status: "active" | "found" | string;
};

type ContactRequest = {
  id: string;
  created_at: string;
  event_id: string;
  sender_id: string;
  message: string;
};

export default function MieiAnnunciPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState<LostEvent[]>([]);
  const [messages, setMessages] = useState<ContactRequest[]>([]);

  const [tab, setTab] = useState<"active" | "found" | "all">("active");

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Carica annunci miei (grazie alla policy select_own_all)
      const { data: ev, error: evErr } = await supabase
        .from("lost_events")
        .select(
          "id, created_at, reporter_id, species, animal_name, description, city, province, lost_date, primary_photo_url, status"
        )
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false });

      if (!evErr && ev) setEvents(ev as any);

      // Carica messaggi ricevuti (policy select_owner su contact_requests)
      const { data: msgs, error: msgErr } = await supabase
        .from("contact_requests")
        .select("id, created_at, event_id, sender_id, message")
        .order("created_at", { ascending: false });

      if (!msgErr && msgs) setMessages(msgs as any);

      setLoading(false);
    }

    init();
  }, [router]);

  const filteredEvents = useMemo(() => {
    if (tab === "all") return events;
    return events.filter((e) => e.status === tab);
  }, [events, tab]);

  function eventMessages(eventId: string) {
    return messages.filter((m) => m.event_id === eventId);
  }

  async function markFound(eventId: string) {
    const ok = window.confirm("Confermi che l’animale è stato ritrovato?");
    if (!ok) return;

    const { error } = await supabase
      .from("lost_events")
      .update({ status: "found" })
      .eq("id", eventId);

    if (error) {
      alert(error.message);
      return;
    }

    // aggiorna local state
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: "found" } : e))
    );
  }

  if (loading) return <p>Caricamento area personale…</p>;

  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">I miei annunci</h1>
      <p className="mt-3 text-zinc-700">
        Qui trovi gli annunci che hai pubblicato e i messaggi ricevuti.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`rounded-full px-4 py-2 text-sm font-medium border ${
            tab === "active"
              ? "bg-black text-white border-black"
              : "bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          Attivi
        </button>
        <button
          type="button"
          onClick={() => setTab("found")}
          className={`rounded-full px-4 py-2 text-sm font-medium border ${
            tab === "found"
              ? "bg-black text-white border-black"
              : "bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          Ritrovati
        </button>
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium border ${
            tab === "all"
              ? "bg-black text-white border-black"
              : "bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          Tutti
        </button>
      </div>

      {/* Lista */}
      {filteredEvents.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-zinc-700">Nessun annuncio in questa sezione.</p>
          <a
            href="/smarrimento"
            className="mt-4 inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Pubblica smarrimento
          </a>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {filteredEvents.map((e) => {
            const msgs = eventMessages(e.id);
            const isActive = e.status === "active";

            return (
              <div
                key={e.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="grid gap-0 md:grid-cols-[240px_1fr]">
                  <img
                    src={
                      (e.primary_photo_url || "/placeholder-animal.jpg") +
                      `?v=${encodeURIComponent(e.created_at)}`
                    }
                    alt={e.animal_name || e.species}
                    className="h-56 w-full object-cover md:h-full"
                    onError={(ev) => {
                      (ev.currentTarget as HTMLImageElement).src =
                        "/placeholder-animal.jpg";
                    }}
                  />

                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">
                          {e.species}
                          {e.animal_name ? ` – ${e.animal_name}` : ""}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-600">
                          {(e.city || "—")}{" "}
                          {e.province ? `(${e.province})` : ""} •{" "}
                          {new Date(e.lost_date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isActive
                              ? "bg-amber-50 text-amber-800"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isActive ? "Attivo" : "Ritrovato"}
                        </span>

                        {isActive && (
                          <button
                            type="button"
                            onClick={() => markFound(e.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Ritrovato ✅
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-zinc-800">{e.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={`/smarrimenti/${e.id}`}
                        className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                      >
                        Apri annuncio
                      </a>
                    </div>

                    {/* Messaggi ricevuti */}
                    <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-900">
                          Messaggi ricevuti
                        </p>
                        <span className="text-xs text-zinc-600">
                          {msgs.length}
                        </span>
                      </div>

                      {msgs.length === 0 ? (
                        <p className="mt-2 text-sm text-zinc-700">
                          Nessun messaggio per questo annuncio (ancora).
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {msgs.slice(0, 5).map((m) => (
                            <div
                              key={m.id}
                              className="rounded-lg border border-zinc-200 bg-white p-3"
                            >
                              <p className="text-xs text-zinc-500">
                                {new Date(m.created_at).toLocaleString()}
                              </p>
                              <p className="mt-1 text-sm text-zinc-800">
                                {m.message}
                              </p>
                            </div>
                          ))}

                          {msgs.length > 5 && (
                            <p className="text-xs text-zinc-500">
                              Mostro solo gli ultimi 5 (nel prossimo step
                              facciamo “vedi tutti”).
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-xs text-zinc-500">
        Nota: questa è la base dell’area personale. Nel prossimo step aggiungiamo:
        “I miei messaggi” + gestione contatti + eventuale modifica annuncio.
      </p>
    </main>
  );
}
