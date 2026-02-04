"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [loading, setLoading] = useState(true);

  const [activeToday, setActiveToday] = useState(0);
  const [active7d, setActive7d] = useState(0);
  const [found7d, setFound7d] = useState(0);

  useEffect(() => {
    async function loadCounts() {
      setLoading(true);

      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const todayISO = startOfToday.toISOString();
      const sevenDaysISO = sevenDaysAgo.toISOString();

      // Attivi creati oggi (usiamo created_at perché è sempre presente)
      const { count: cToday } = await supabase
        .from("lost_events")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("created_at", todayISO);

      // Attivi ultimi 7 giorni
      const { count: cActive7d } = await supabase
        .from("lost_events")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("created_at", sevenDaysISO);

      // Ritrovati ultimi 7 giorni
      const { count: cFound7d } = await supabase
        .from("lost_events")
        .select("id", { count: "exact", head: true })
        .eq("status", "found")
        .gte("created_at", sevenDaysISO);

      setActiveToday(cToday ?? 0);
      setActive7d(cActive7d ?? 0);
      setFound7d(cFound7d ?? 0);

      setLoading(false);
    }

    loadCounts();
  }, []);

  return (
    <main className="space-y-10">
      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold tracking-tight">
            UNIMALIA
            <span className="block text-zinc-600 text-2xl font-semibold mt-2">
              Il luogo dove ritrovare il tuo animale.
            </span>
          </h1>

          <p className="max-w-2xl text-zinc-700 text-lg leading-8">
            Pubblica uno smarrimento con foto e luogo preciso, oppure consulta quelli attivi nella tua zona.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/smarrimento"
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Pubblica smarrimento
            </a>
            <a
              href="/smarrimenti"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Vedi smarrimenti
            </a>
            <a
              href="/ritrovati"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Ritrovati
            </a>
          </div>

          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold">📍 Luogo preciso</p>
              <p className="mt-1 text-sm text-zinc-700">
                Cerca su Google Maps e affina con il pin.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold">📸 Foto</p>
              <p className="mt-1 text-sm text-zinc-700">
                Una foto chiara aiuta tantissimo il ritrovamento.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold">💬 Contatto</p>
              <p className="mt-1 text-sm text-zinc-700">
                Chi lo vede può contattarti subito.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-xs text-zinc-500">Smarrimenti attivi oggi</p>
              <p className="mt-1 text-3xl font-bold">
                {loading ? "…" : activeToday}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-xs text-zinc-500">Smarrimenti attivi (7 giorni)</p>
              <p className="mt-1 text-3xl font-bold">
                {loading ? "…" : active7d}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-xs text-zinc-500">Ritrovati (7 giorni)</p>
              <p className="mt-1 text-3xl font-bold">
                {loading ? "…" : found7d}
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            Nota: i contatori si basano sulla data di pubblicazione (created_at).
          </p>
        </div>
      </section>
    </main>
  );
}
