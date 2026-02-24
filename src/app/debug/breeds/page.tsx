// app/debug/breeds/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function DebugBreedsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [dogCount, setDogCount] = useState<number | null>(null);
  const [catCount, setCatCount] = useState<number | null>(null);
  const [dogSample, setDogSample] = useState<any[]>([]);
  const [catSample, setCatSample] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setErr("");

      const dog = await supabase
        .from("breeds")
        .select("id,name", { count: "exact" })
        .eq("species", "dog")
        .order("name", { ascending: true })
        .limit(20);

      const cat = await supabase
        .from("breeds")
        .select("id,name", { count: "exact" })
        .eq("species", "cat")
        .order("name", { ascending: true })
        .limit(20);

      if (!mounted) return;

      if (dog.error || cat.error) {
        setErr(dog.error?.message || cat.error?.message || "Errore");
        setLoading(false);
        return;
      }

      setDogCount(dog.count ?? null);
      setCatCount(cat.count ?? null);
      setDogSample(dog.data ?? []);
      setCatSample(cat.data ?? []);
      setLoading(false);
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">Debug breeds</h1>

      {loading ? <p className="mt-3 text-sm text-zinc-700">Caricamento…</p> : null}
      {err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-900">
          <b>Dog count:</b> {dogCount ?? "—"} &nbsp; | &nbsp; <b>Cat count:</b> {catCount ?? "—"}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-zinc-900">Prime 20 (dog)</p>
            <pre className="mt-2 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-800">
              {JSON.stringify(dogSample, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">Prime 20 (cat)</p>
            <pre className="mt-2 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-800">
              {JSON.stringify(catSample, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-500">Apri: <b>/debug/breeds</b></p>
    </div>
  );
}