"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  display_name: string;
  category: string;
  city: string;
  province: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
};

const CATEGORIES = [
  { key: "", label: "Tutte" },
  { key: "veterinario", label: "Veterinari" },
  { key: "toelettatura", label: "Toelettatura" },
  { key: "pensione", label: "Pensioni" },
  { key: "pet_sitter", label: "Pet sitter" },
  { key: "addestramento", label: "Addestramento" },
  { key: "altro", label: "Altro" },
];

function catLabel(cat: string) {
  const found = CATEGORIES.find((c) => c.key === cat);
  return found?.label ?? cat;
}

export default function ServiziPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Professional[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("professionals")
        .select("id,display_name,category,city,province,address,phone,email,website,description")
        .eq("approved", true)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (error) {
        setError("Errore nel caricamento dei professionisti. Riprova.");
        setItems([]);
      } else {
        setItems((data as Professional[]) || []);
      }

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const c = city.trim().toLowerCase();
    const cat = category.trim().toLowerCase();

    return items.filter((p) => {
      const cityOk = !c || (p.city ?? "").toLowerCase().includes(c);
      const catOk = !cat || (p.category ?? "").toLowerCase() === cat;
      return cityOk && catOk;
    });
  }, [items, city, category]);

  function reset() {
    setCity("");
    setCategory("");
  }

  return (
    <main>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servizi</h1>
          <p className="mt-3 max-w-2xl text-zinc-700">
            Cerca veterinari, toelettatori, pensioni, pet sitter e altri servizi vicino a te.
          </p>
        </div>

        <Link href="/" className="text-sm font-medium text-zinc-600 hover:underline">
          ← Home
        </Link>
      </div>

      {/* CATEGORIE VISIBILI (chips) */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-black text-white"
                  : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
              ].join(" ")}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* FILTRI */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-900">Città</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder="Es. Firenze"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {/* Select utile soprattutto su mobile: resta */}
          <div>
            <label className="block text-sm font-medium text-zinc-900">Categoria</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Reset
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Risultati: <span className="font-medium text-zinc-700">{filtered.length}</span>
        </p>
      </div>

      {/* GRIGLIA */}
      <div className="mt-8">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-700">Caricamento…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-700">
              Nessun risultato. Prova a cambiare città o categoria.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/servizi/${p.id}`}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{p.display_name}</p>
                    <p className="mt-1 text-sm text-zinc-600">{catLabel(p.category)}</p>
                  </div>

                  <span className="text-xs text-zinc-500">
                    {p.city}
                    {p.province ? ` (${p.province})` : ""}
                  </span>
                </div>

                {p.description ? (
                  <p className="mt-3 line-clamp-3 text-sm text-zinc-700">{p.description}</p>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500">Scheda in aggiornamento.</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-600">
                  {p.phone && <span className="rounded-full bg-zinc-100 px-3 py-1">📞 Telefono</span>}
                  {p.email && <span className="rounded-full bg-zinc-100 px-3 py-1">✉️ Email</span>}
                  {p.website && <span className="rounded-full bg-zinc-100 px-3 py-1">🌐 Sito</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
