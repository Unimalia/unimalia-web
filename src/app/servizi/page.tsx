"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  display_name: string;
  category: string; // macro key
  city: string;
  province: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
};

type Tag = {
  id: string;
  macro: string; // es: "veterinari"
  key: string;   // es: "tac"
  label: string; // es: "TAC / TC"
  sort_order: number;
};

type TagLink = {
  professional_id: string;
  tag_id: string;
};

const MACRO_CATEGORIES = [
  { key: "", label: "Tutte" },
  { key: "veterinari", label: "Veterinari" },
  { key: "toelettatura", label: "Toelettatura" },
  { key: "pensione", label: "Pensioni" },
  { key: "pet_sitter", label: "Pet sitter & Dog walking" },
  { key: "addestramento", label: "Addestramento" },
  { key: "ponte_arcobaleno", label: "Ponte dell’Arcobaleno" },
  { key: "altro", label: "Altro" },
];

function macroLabel(key: string) {
  return MACRO_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export default function ServiziPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [links, setLinks] = useState<TagLink[]>([]);

  // filtri
  const [city, setCity] = useState("");
  const [macro, setMacro] = useState(""); // macro category
  const [selectedTagId, setSelectedTagId] = useState<string>(""); // skill selezionata da autofill

  // search + autocomplete
  const [q, setQ] = useState("");
  const [openSug, setOpenSug] = useState(false);
  const sugBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (sugBoxRef.current && !sugBoxRef.current.contains(t)) {
        setOpenSug(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadAll() {
      setLoading(true);
      setError(null);

      // 1) professionals approvati
      const pr = await supabase
        .from("professionals")
        .select("id,display_name,category,city,province,address,phone,email,website,description")
        .eq("approved", true)
        .order("created_at", { ascending: false });

      // 2) tags attivi
      const tg = await supabase
        .from("professional_tags")
        .select("id,macro,key,label,sort_order")
        .eq("active", true)
        .order("macro", { ascending: true })
        .order("sort_order", { ascending: true });

      // 3) links (per gli approved): li leggiamo tutti e filtriamo lato client
      const ln = await supabase
        .from("professional_tag_links")
        .select("professional_id,tag_id");

      if (!alive) return;

      if (pr.error) {
        setError("Errore nel caricamento dei professionisti. Riprova.");
        setProfessionals([]);
        setTags([]);
        setLinks([]);
        setLoading(false);
        return;
      }
      if (tg.error) {
        setError("Errore nel caricamento delle categorie. Riprova.");
        setProfessionals((pr.data as Professional[]) || []);
        setTags([]);
        setLinks([]);
        setLoading(false);
        return;
      }
      if (ln.error) {
        setError("Errore nel caricamento dei filtri. Riprova.");
        setProfessionals((pr.data as Professional[]) || []);
        setTags((tg.data as Tag[]) || []);
        setLinks([]);
        setLoading(false);
        return;
      }

      setProfessionals((pr.data as Professional[]) || []);
      setTags((tg.data as Tag[]) || []);
      setLinks((ln.data as TagLink[]) || []);
      setLoading(false);
    }

    loadAll();
    return () => {
      alive = false;
    };
  }, []);

  // map: professional_id -> set(tag_id)
  const proTagsMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of links) {
      if (!m.has(l.professional_id)) m.set(l.professional_id, new Set());
      m.get(l.professional_id)!.add(l.tag_id);
    }
    return m;
  }, [links]);

  // suggerimenti autocomplete (su label e key)
  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return tags
      .filter((t) => {
        const a = t.label.toLowerCase().includes(s);
        const b = t.key.toLowerCase().includes(s);
        return a || b;
      })
      .slice(0, 8);
  }, [q, tags]);

  function selectSuggestion(t: Tag) {
    setSelectedTagId(t.id);
    setMacro(t.macro); // porta direttamente nella macro corretta
    setQ(t.label);
    setOpenSug(false);
  }

  function resetFilters() {
    setCity("");
    setMacro("");
    setSelectedTagId("");
    setQ("");
    setOpenSug(false);
  }

  const filtered = useMemo(() => {
    const c = city.trim().toLowerCase();
    const m = macro.trim().toLowerCase();
    const tagId = selectedTagId;

    return professionals.filter((p) => {
      const cityOk = !c || (p.city ?? "").toLowerCase().includes(c);
      const macroOk = !m || (p.category ?? "").toLowerCase() === m;

      let tagOk = true;
      if (tagId) {
        const set = proTagsMap.get(p.id);
        tagOk = !!set && set.has(tagId);
      }

      return cityOk && macroOk && tagOk;
    });
  }, [professionals, city, macro, selectedTagId, proTagsMap]);

  // mostra 3 chip skill sulle card (se disponibili)
  const tagById = useMemo(() => {
    const m = new Map<string, Tag>();
    for (const t of tags) m.set(t.id, t);
    return m;
  }, [tags]);

  function proTopTags(proId: string) {
    const set = proTagsMap.get(proId);
    if (!set) return [];
    const ids = Array.from(set.values());
    const list = ids
      .map((id) => tagById.get(id))
      .filter(Boolean) as Tag[];
    return list.slice(0, 3);
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

      {/* CHIPS MACRO */}
      <div className="mt-6 flex flex-wrap gap-2">
        {MACRO_CATEGORIES.map((c) => {
          const active = macro === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setMacro(c.key);
                setSelectedTagId(""); // cambi macro → reset skill specifica
              }}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                active ? "bg-black text-white" : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
              ].join(" ")}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* FILTRI + CERCA */}
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

          {/* CERCA con autofill */}
          <div className="sm:col-span-2" ref={sugBoxRef}>
            <label className="block text-sm font-medium text-zinc-900">Cerca (es. “tac”, “ecografia”, “ricovero”)</label>
            <div className="relative">
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                placeholder="Scrivi un servizio…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOpenSug(true);
                  setSelectedTagId(""); // se sto scrivendo, tolgo selezione precedente
                }}
                onFocus={() => setOpenSug(true)}
              />

              {openSug && suggestions.length > 0 && (
                <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                  {suggestions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectSuggestion(t)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-zinc-50"
                    >
                      <span className="font-medium text-zinc-900">{t.label}</span>
                      <span className="text-xs text-zinc-500">{macroLabel(t.macro)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedTagId && (
              <p className="mt-2 text-xs text-zinc-500">
                Filtro attivo: <span className="font-semibold text-zinc-700">{q}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTagId("");
                    setQ("");
                  }}
                  className="ml-2 hover:underline"
                >
                  rimuovi
                </button>
              </p>
            )}
          </div>

          <div className="sm:col-span-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Risultati: <span className="font-medium text-zinc-700">{filtered.length}</span>
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Reset filtri
            </button>
          </div>
        </div>
      </div>

      {/* LISTA */}
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
              Nessun risultato. Prova a cambiare città, macro-categoria o ricerca.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const top = proTopTags(p.id);

              return (
                <Link
                  key={p.id}
                  href={`/servizi/${p.id}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{p.display_name}</p>
                      <p className="mt-1 text-sm text-zinc-600">{macroLabel(p.category)}</p>
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

                  {top.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {top.map((t) => (
                        <span
                          key={t.id}
                          className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700"
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
