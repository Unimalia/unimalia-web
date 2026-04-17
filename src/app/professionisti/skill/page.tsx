"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  owner_id: string | null;
  category: string;
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

function categoryLabel(category: string) {
  switch ((category || "").trim()) {
    case "veterinari":
      return "Veterinari";
    case "toelettatura":
      return "Toelettatura";
    case "pensione":
      return "Pensioni";
    case "pet_sitter":
      return "Pet sitter & Dog walking";
    case "addestramento":
      return "Addestramento";
    case "ponte_arcobaleno":
      return "Ponte dell’Arcobaleno";
    case "pet_detective":
      return "Pet Detective";
    case "altro":
    default:
      return "Altro";
  }
}

function groupTags(tags: Tag[]) {
  const grouped: Record<string, Tag[]> = {};

  for (const tag of tags) {
    const key = tag.macro || "altro";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tag);
  }

  Object.values(grouped).forEach((items) => {
    items.sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, "it"));
  });

  return grouped;
}

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

      const { data: tagData, error: tagErr } = await supabase
        .from("professional_tags")
        .select("id,macro,key,label,sort_order,active")
        .eq("active", true)
        .eq("macro", p.category)
        .order("sort_order", { ascending: true });

      if (!alive) return;

      if (tagErr) {
        setError("Errore nel caricamento delle skill.");
        setTags([]);
      } else {
        setTags((tagData as Tag[]) || []);
      }

      const { data: linkData, error: linkErr } = await supabase
        .from("professional_tag_links")
        .select("professional_id,tag_id")
        .eq("professional_id", p.id);

      if (!alive) return;

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

    void load();

    return () => {
      alive = false;
    };
  }, [router]);

  const selectedCount = useMemo(() => selected.size, [selected]);

  const groupedTags = useMemo(() => groupTags(tags), [tags]);

  const selectedLabels = useMemo(() => {
    const selectedIds = selected;
    return tags.filter((t) => selectedIds.has(t.id)).map((t) => t.label);
  }, [selected, tags]);

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

      const { data: linkData } = await supabase
        .from("professional_tag_links")
        .select("professional_id,tag_id")
        .eq("professional_id", pro.id);

      const l = (linkData as TagLink[]) || [];
      setLinks(l);
      setSelected(new Set(l.map((x) => x.tag_id)));

      router.replace("/professionisti/dashboard?pending=1");
    } catch {
      setError("Errore nel salvataggio delle skill. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f6f9fc_100%)]">
        <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="overflow-hidden rounded-[2rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_20px_60px_rgba(48,72,111,0.08)] sm:p-8">
            <div className="h-3 w-36 rounded-full bg-[#dfe7f0]" />
            <div className="mt-5 h-10 w-72 rounded-2xl bg-[#eef3f8]" />
            <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-[#eef3f8]" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[1.6rem] border border-[#e3e9f0] bg-white p-5 shadow-sm"
                >
                  <div className="h-4 w-40 rounded-full bg-[#eef3f8]" />
                  <div className="mt-3 h-3 w-28 rounded-full bg-[#f1f5f9]" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_20px_60px_rgba(48,72,111,0.08)]">
          <div className="border-b border-[#e7edf4] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                  Step 2 di 2
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#30486f] sm:text-4xl">
                  Scegli i servizi che offri
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#55657d] sm:text-base">
                  Questa selezione serve a definire come il tuo profilo verrà trovato nell’area
                  servizi UNIMALIA. Scegli solo ciò che rappresenta davvero la tua attività.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-[#dbe5ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#55657d]">
                    Scheda: {pro?.display_name || "—"}
                  </span>

                  <span className="inline-flex rounded-full border border-[#dbe5ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#55657d]">
                    Categoria: {categoryLabel(pro?.category || "")}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/professionisti")}
                  className="inline-flex items-center rounded-full border border-[#d8e1eb] bg-white px-4 py-2 text-sm font-semibold text-[#30486f] transition hover:border-[#c9d5e2] hover:bg-[#f8fbff]"
                >
                  ← Indietro
                </button>

                <Link
                  href="/servizi"
                  className="text-sm font-semibold text-[#5f708a] underline-offset-4 transition hover:text-[#30486f] hover:underline"
                >
                  Vai ai Servizi
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold text-amber-900">Profilo inviato correttamente</p>
                <p className="mt-2 text-sm leading-7 text-amber-800">
                  Dopo il salvataggio finale, il profilo resterà in verifica prima
                  dell’abilitazione completa. La revisione avviene in genere entro 24/48 ore.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#30486f]">Servizi offerti</h2>
                    <p className="mt-1 text-sm leading-7 text-[#55657d]">
                      Seleziona una o più skill. Potrai modificarle anche in seguito.
                    </p>
                  </div>

                  <div className="rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1.5 text-xs font-semibold text-[#5f708a]">
                    Selezionate: <span className="text-[#30486f]">{selectedCount}</span>
                  </div>
                </div>

                {tags.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm text-[#5f708a]">
                    Nessuna skill disponibile per questa categoria.
                  </div>
                ) : (
                  <div className="mt-5 space-y-5">
                    {Object.entries(groupedTags).map(([macro, macroTags]) => (
                      <div key={macro} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                              Area
                            </p>
                            <h3 className="mt-1 text-base font-semibold text-[#30486f]">
                              {categoryLabel(macro)}
                            </h3>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {macroTags.map((t) => {
                            const active = selected.has(t.id);

                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => toggleTag(t.id)}
                                className={`group rounded-[1.4rem] border p-4 text-left transition ${
                                  active
                                    ? "border-[#30486f] bg-[#30486f] text-white shadow-[0_14px_32px_rgba(48,72,111,0.18)]"
                                    : "border-[#e3e9f0] bg-white text-[#30486f] hover:-translate-y-0.5 hover:border-[#cfd9e5] hover:bg-[#f8fbff]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold">{t.label}</div>
                                    <div
                                      className={`mt-1 text-xs ${
                                        active ? "text-white/75" : "text-[#6f7d91]"
                                      }`}
                                    >
                                      {t.key}
                                    </div>
                                  </div>

                                  <div
                                    className={`mt-0.5 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[11px] font-bold ${
                                      active
                                        ? "bg-white text-[#30486f]"
                                        : "border border-[#dbe5ef] bg-white text-[#6f7d91]"
                                    }`}
                                  >
                                    {active ? "✓" : "+"}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {error ? (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveSkills}
                    className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
                  >
                    {saving ? "Salvataggio..." : "Salva e chiudi"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/professionisti/dashboard?pending=1")}
                    className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
                  >
                    Salta per ora
                  </button>
                </div>

                <p className="mt-4 text-xs leading-6 text-[#6f7d91]">
                  Scegli solo i servizi reali che vuoi rendere ricercabili nel profilo professionista.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.6rem] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                  Anteprima
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#30486f]">
                  Come si presenterà il profilo
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#55657d]">
                  Le skill selezionate aiutano gli utenti a capire subito cosa fai e migliorano la
                  ricerca nell’area servizi.
                </p>

                <div className="mt-5 rounded-[1.4rem] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                  <div className="text-lg font-semibold text-[#30486f]">
                    {pro?.display_name || "Il tuo profilo"}
                  </div>

                  <div className="mt-2 text-sm text-[#5f708a]">
                    {categoryLabel(pro?.category || "")}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedLabels.length > 0 ? (
                      selectedLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1.5 text-xs font-semibold text-[#55657d]"
                        >
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[#6f7d91]">
                        Nessuna skill selezionata ancora.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                  Nota importante
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#30486f]">
                  Selezione chiara, profilo più forte
                </h2>

                <div className="mt-4 space-y-3 text-sm leading-7 text-[#55657d]">
                  <p>
                    Evita di selezionare skill non realmente offerte: un profilo più preciso è anche
                    più credibile.
                  </p>
                  <p>
                    Questa schermata definisce il posizionamento del tuo profilo nei risultati di
                    ricerca UNIMALIA.
                  </p>
                  <p>
                    Potrai sempre tornare in seguito a modificare o ampliare le skill selezionate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}