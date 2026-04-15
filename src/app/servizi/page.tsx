"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  verification_status: string;
  verification_level: string;
  public_visible: boolean;
};

type Tag = {
  id: string;
  macro: string;
  key: string;
  label: string;
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
  { key: "pet_detective", label: "Pet Detective" },
  { key: "ponte_arcobaleno", label: "Ponte dell’Arcobaleno" },
  { key: "altro", label: "Altro" },
];

function macroLabel(key: string) {
  return MACRO_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

function verificationBadgeLabel(p: Professional) {
  if (p.verification_level === "regulated_vet") {
    return "Struttura veterinaria verificata";
  }
  if (p.verification_level === "business") {
    return "Attività verificata";
  }
  return "Profilo base verificato";
}

export default function ServiziPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [links, setLinks] = useState<TagLink[]>([]);

  const [city, setCity] = useState("");
  const [macro, setMacro] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>("");

  const [q, setQ] = useState("");
  const [openSug, setOpenSug] = useState(false);
  const sugBoxRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

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

      const pr = await supabase
        .from("professionals")
        .select(
          "id,display_name,category,city,province,address,phone,email,website,description,verification_status,verification_level,public_visible"
        )
        .eq("public_visible", true)
        .eq("verification_status", "verified")
        .order("created_at", { ascending: false });

      const tg = await supabase
        .from("professional_tags")
        .select("id,macro,key,label,sort_order")
        .eq("active", true)
        .order("macro", { ascending: true })
        .order("sort_order", { ascending: true });

      const ln = await supabase.from("professional_tag_links").select("professional_id,tag_id");

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

    void loadAll();
    return () => {
      alive = false;
    };
  }, []);

  const proTagsMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of links) {
      if (!m.has(l.professional_id)) m.set(l.professional_id, new Set());
      m.get(l.professional_id)!.add(l.tag_id);
    }
    return m;
  }, [links]);

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
    setMacro(t.macro);
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

  function selectMacroCategory(categoryKey: string) {
    setMacro(categoryKey);
    setSelectedTagId("");
    setQ("");
    setOpenSug(false);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
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

  const tagById = useMemo(() => {
    const m = new Map<string, Tag>();
    for (const t of tags) m.set(t.id, t);
    return m;
  }, [tags]);

  function proTopTags(proId: string) {
    const set = proTagsMap.get(proId);
    if (!set) return [];
    const ids = Array.from(set.values());
    const list = ids.map((id) => tagById.get(id)).filter(Boolean) as Tag[];
    return list.slice(0, 3);
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
      <div className="mx-auto max-w-[1260px] px-4 py-8 sm:py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.10)]">
          <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                Rete professionisti
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[#30486f] sm:text-5xl lg:text-6xl">
                Trova il professionista giusto per il tuo animale
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#5f708a] sm:text-lg">
                Veterinari, toelettatori, pensioni, pet sitter, addestratori e altri servizi
                in un’unica ricerca più ordinata, filtrabile e chiara.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {MACRO_CATEGORIES.filter((c) => c.key !== "").map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => selectMacroCategory(c.key)}
                    className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
              <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                      Ricerca
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-[#30486f]">
                      Filtra per città, categoria o servizio
                    </h2>
                  </div>

                  <p className="text-sm text-[#6f7d91]">
                    Risultati:{" "}
                    <span className="font-semibold text-[#30486f]">{filtered.length}</span>
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900">Città</label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#2f69c7]"
                      placeholder="Es. Firenze"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-900">
                      Macro-categoria
                    </label>
                    <select
                      className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#2f69c7]"
                      value={macro}
                      onChange={(e) => {
                        setMacro(e.target.value);
                        setSelectedTagId("");
                      }}
                    >
                      {MACRO_CATEGORIES.map((c) => (
                        <option key={c.key || "all"} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2" ref={sugBoxRef}>
                    <label className="block text-sm font-semibold text-zinc-900">
                      Cerca un servizio
                    </label>
                    <div className="relative">
                      <input
                        className="mt-1 w-full rounded-2xl border border-[#d7dfe9] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#2f69c7]"
                        placeholder="Es. tac, ecografia, ricovero…"
                        value={q}
                        onChange={(e) => {
                          setQ(e.target.value);
                          setOpenSug(true);
                          setSelectedTagId("");
                        }}
                        onFocus={() => setOpenSug(true)}
                      />

                      {openSug && suggestions.length > 0 && (
                        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-[1.2rem] border border-[#e3e9f0] bg-white shadow-[0_18px_40px_rgba(42,56,86,0.12)]">
                          {suggestions.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => selectSuggestion(t)}
                              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-[#f8fbff]"
                            >
                              <span className="font-medium text-zinc-900">{t.label}</span>
                              <span className="text-xs text-[#6f7d91]">{macroLabel(t.macro)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedTagId && (
                      <p className="mt-2 text-xs text-[#6f7d91]">
                        Filtro attivo:{" "}
                        <span className="font-semibold text-[#30486f]">{q}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTagId("");
                            setQ("");
                          }}
                          className="ml-2 font-medium hover:underline"
                        >
                          rimuovi
                        </button>
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
                    >
                      Reset filtri
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div ref={resultsRef} className="mt-8">
          {loading ? (
            <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
              <p className="text-sm text-[#5f708a]">Caricamento…</p>
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-red-200 bg-white p-6 text-sm text-red-700 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-8 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
                Nessun risultato
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">
                Prova a cambiare città, macro-categoria o ricerca.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const top = proTopTags(p.id);

                return (
                  <Link
                    key={p.id}
                    href={`/servizi/${p.id}`}
                    className="rounded-[2rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_14px_40px_rgba(42,56,86,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(42,56,86,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#30486f]">
                          {p.display_name}
                        </h2>
                        <p className="mt-1 text-sm text-[#5f708a]">{macroLabel(p.category)}</p>
                      </div>
                      <span className="text-xs text-[#6f7d91]">
                        {p.city}
                        {p.province ? ` (${p.province})` : ""}
                      </span>
                    </div>

                    <div className="mt-4">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {verificationBadgeLabel(p)}
                      </span>
                    </div>

                    {p.description ? (
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#5f708a]">
                        {p.description}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm text-[#6f7d91]">Scheda in aggiornamento.</p>
                    )}

                    {top.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {top.map((t) => (
                          <span
                            key={t.id}
                            className="rounded-full bg-[#f4f7fb] px-3 py-1 text-xs font-semibold text-[#4f6078]"
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
      </div>
    </main>
  );
}