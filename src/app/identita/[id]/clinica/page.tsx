"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PageShell } from "@/_components/ui/page-shell";
import { ButtonPrimary } from "@/_components/ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EventItem = {
  id: string;
  event_date: string;
  type: string;
  title: string;
  description: string | null;
};

export default function AnimalClinicalPage() {
  const params = useParams<{ id: string }>();
  const animalId = params?.id;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("note");

  useEffect(() => {
    if (!animalId) return;

    async function fetchEvents() {
      const { data } = await supabase
        .from("animal_clinic_events")
        .select("*")
        .eq("animal_id", animalId)
        .order("event_date", { ascending: false });

      setEvents(data || []);
      setLoading(false);
    }

    fetchEvents();
  }, [animalId]);

  async function addEvent() {
    if (!animalId || !title) return;

    await supabase.from("animal_clinic_events").insert({
      animal_id: animalId,
      event_date: new Date().toISOString(),
      type,
      title,
    });

    setTitle("");

    const { data } = await supabase
      .from("animal_clinic_events")
      .select("*")
      .eq("animal_id", animalId)
      .order("event_date", { ascending: false });

    setEvents(data || []);
  }

  return (
    <PageShell
      title="Cartella clinica"
      subtitle="Timeline eventi sanitari"
      backFallbackHref={`/identita/${animalId}`}
    >
      <div className="flex flex-col gap-8">

        {/* FORM NUOVO EVENTO */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Nuovo evento</h2>

          <div className="mt-4 flex flex-col gap-3">
            <input
              className="rounded border p-2"
              placeholder="Titolo evento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <select
              className="rounded border p-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="note">Nota</option>
              <option value="visit">Visita</option>
              <option value="vaccine">Vaccino</option>
              <option value="exam">Esame</option>
              <option value="therapy">Terapia</option>
              <option value="emergency">Emergenza</option>
            </select>

            <ButtonPrimary onClick={addEvent}>
              Aggiungi evento
            </ButtonPrimary>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Timeline</h2>

          {loading && <p className="text-sm text-zinc-500">Caricamento...</p>}

          {!loading && events.length === 0 && (
            <p className="text-sm text-zinc-500">
              Nessun evento registrato.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border p-4"
              >
                <div className="text-xs text-zinc-500">
                  {new Date(ev.event_date).toLocaleString()}
                </div>
                <div className="font-semibold mt-1">
                  {ev.title}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Tipo: {ev.type}
                </div>
                {ev.description && (
                  <div className="text-sm mt-2">
                    {ev.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </PageShell>
  );
}