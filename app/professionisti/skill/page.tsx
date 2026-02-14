"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  owner_id: string | null;
  category: string; // macro
  display_name: string;
};

type Tag = {
  id: string;
  macro: string;
  key: string;
  label: string;
  sort_order: number;
  active: boolean;
};

type TagLink = {
  professional_id: string;
  tag_id: string;
};

export default function ProfessionistiSkillPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pro, setPro] = useState<Professional | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [links, setLinks] = useState<TagLink[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      // trova la tua scheda
      const { data: proData, error: proErr } = await supabase
        .from("professionals")
        .select("id,owner_id,category,display_name")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!alive) return;

      if (proErr || !proData || proData.length === 0) {
        router.replace("/professionisti/nuovo");
        return;
      }

      const p = proData[0] as Professional;
      setPro(p);

      // tags della macro
      const { data: tagData, error: tagErr } = await supabase
        .from("professional_tags")
        .select("id,macro,key,label,sort_order,active")
        .eq("active", true)
        .eq("macro", p.category)
        .order("sort_order", { ascending: true });

      if (tagErr) {
        setError("Errore nel caricamento delle skill.");
        setTags([]);
      } else {
        setTags((tagData as Tag[]) || []);
      }

      // links attuali
      const { data: linkData, error: linkErr } = await supabase
        .from("professional_tag_links")
        .select("professional_id,tag_id")
        .eq("professional_id", p.id);

      if (linkErr) {
        setError("Errore nel caricamento delle skill selezionate.");
        setLinks([]);
        setSelected(new Set());
      } else {
        const l = (linkData as TagLink[]) || [];
        setLinks(l);
        setSelected(new Set(l.map((x) => x.tag_id)));
      }

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [router]);

  const selectedCount = useMemo(() => selected.size, [selected]);

  function toggleTag(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveSkills() {
    setError(null);
    if (!pro) return;

    // obbligo minimo: almeno 1 skill
    if (selected.size === 0) {
      setError("Seleziona almeno una skill per continuare.");
      return;
    }

    setSaving(true);
    try {
      const oldSet = new Set(links.map((x) => x.tag_id));
      const newSet = selected;

      const toAdd = Array.from(newSet).filter((id) => !oldSet.has(id));
      const toRemove = Array.from(oldSet).filter((id) => !newSet.has(id));

      if (toRemove.length > 0) {
        const { error: delErr } = await supabase
          .from("professional_tag_links")
          .delete()
          .eq("professional_id", pro.id)
          .in("tag_id", toRemove);

        if (delErr) throw delErr;
      }

      if (toAdd.length > 0) {
        const payload = toAdd.map((tag_id) => ({ professional_id: pro.id, tag_id }));
        const { error: insErr } = await supabase.from("professional_tag_links").insert(payload);
        if (insErr) throw insErr;
      }

      // reload
      const { data: linkData } = await supabase
        .from("professional_tag_links")
        .select("professional_id,tag_id")
        .eq("professional_id", pro.id);

      const l = (linkData as TagLink[]) || [];
      setLinks(l);
      setSelected(new Set(l.map((x) => x.tag_id)));

      router.replace("/professionisti");
    } catch (e: any) {
      setError("Errore nel salvataggio delle skill. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main>
        <p className="text-sm text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  return (
    <main>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scegli le skill</h1>
          <p className="mt-2 text-zinc-700">
            {pro ? `Scheda: ${pro.display_name}` : "—"}
          </p>
        </div>

        <Link href="/professionisti" className="text-sm font-medium text-zinc-600 hover:underline">
          ← Portale
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">
          Seleziona i servizi che offri. Puoi modificarli in qualsiasi momento.
        </p>

        <p className="mt-3 text-xs text-zinc-500">
          Selezionate: <span className="font-semibold text-zinc-700">{selectedCount}</span>
        </p>

        <div className="mt-5 space-y-2">
          {tags.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nessuna skill disponibile per questa categoria (per ora).
            </p>
          ) : (
            tags.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(t.id)}
                  onChange={() => toggleTag(t.id)}
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900">{t.label}</p>
                  <p className="text-xs text-zinc-500">{t.key}</p>
                </div>
              </label>
            ))
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <button
          type="button"
          disabled={saving}
          onClick={saveSkills}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Salvataggio..." : "Salva skill"}
        </button>
      </div>
    </main>
  );
}
