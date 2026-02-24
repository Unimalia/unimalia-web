"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Professional = {
  id: string;
  owner_id: string | null;
  approved: boolean;
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

const MACRO = [
  { key: "veterinari", label: "Veterinari" },
  { key: "toelettatura", label: "Toelettatura" },
  { key: "pensione", label: "Pensioni" },
  { key: "pet_sitter", label: "Pet sitter & Dog walking" },
  { key: "addestramento", label: "Addestramento" },
  { key: "ponte_arcobaleno", label: "Ponte dell’Arcobaleno" },
  { key: "altro", label: "Altro" },
];

export default function ModificaProfessionistaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pro, setPro] = useState<Professional | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [links, setLinks] = useState<TagLink[]>([]);

  // form fields
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("veterinari");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  // selected skill tag ids
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

      // load my professional
      const { data: proData, error: proErr } = await supabase
        .from("professionals")
        .select("id,owner_id,approved,display_name,category,city,province,address,phone,email,website,description")
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

      // fill fields
      setDisplayName(p.display_name ?? "");
      setCategory(p.category ?? "veterinari");
      setCity(p.city ?? "");
      setProvince(p.province ?? "");
      setAddress(p.address ?? "");
      setPhone(p.phone ?? "");
      setEmail(p.email ?? "");
      setWebsite(p.website ?? "");
      setDescription(p.description ?? "");

      // load tags (active)
      const { data: tagData, error: tagErr } = await supabase
        .from("professional_tags")
        .select("id,macro,key,label,sort_order,active")
        .eq("active", true)
        .order("macro", { ascending: true })
        .order("sort_order", { ascending: true });

      if (tagErr) {
        setError("Errore nel caricamento delle skill.");
        setTags([]);
      } else {
        setTags((tagData as Tag[]) || []);
      }

      // load my links
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

  const tagsForMacro = useMemo(() => {
    return tags.filter((t) => t.macro === category);
  }, [tags, category]);

  function toggleTag(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setError(null);

    if (!pro) return;

    if (displayName.trim().length < 2) {
      setError("Inserisci un nome valido (minimo 2 caratteri).");
      return;
    }
    if (city.trim().length < 2) {
      setError("Inserisci una città valida.");
      return;
    }

    setSaving(true);
    try {
      // update professional info
      const { error: upErr } = await supabase
        .from("professionals")
        .update({
          display_name: displayName.trim(),
          category,
          city: city.trim(),
          province: province.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          website: website.trim() || null,
          description: description.trim() || null,
        })
        .eq("id", pro.id);

      if (upErr) throw upErr;

      // sync links (diff)
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
        const payload = toAdd.map((tag_id) => ({
          professional_id: pro.id,
          tag_id,
        }));

        const { error: insErr } = await supabase
          .from("professional_tag_links")
          .insert(payload);

        if (insErr) throw insErr;
      }

      // reload links state
      const { data: linkData } = await supabase
        .from("professional_tag_links")
        .select("professional_id,tag_id")
        .eq("professional_id", pro.id);

      const l = (linkData as TagLink[]) || [];
      setLinks(l);
      setSelected(new Set(l.map((x) => x.tag_id)));
    } catch (e: any) {
      setError("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-700">Caricamento…</p>;

  return (
    <main>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Modifica scheda</h1>
        <Link href="/professionisti" className="text-sm font-medium text-zinc-600 hover:underline">
          ← Portale
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* FORM */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">DATI SCHEDA</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Nome attività / professionista</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Macro-categoria</label>
              <select
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  // non cancelliamo le skill, perché un professionista potrebbe cambiare macro in futuro
                  // ma per ora le skill mostrate saranno solo quelle della macro selezionata
                }}
              >
                {MACRO.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Città</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Provincia</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Es. FI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Indirizzo</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Telefono</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Sito</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Descrizione</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Salvataggio..." : "Salva modifiche"}
          </button>

          <p className="mt-4 text-xs text-zinc-500">
            Nota: se cambi competenze, puoi farlo quando vuoi. La scheda pubblica mostra le skill selezionate.
          </p>
        </div>

        {/* SKILLS */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">SKILL / SERVIZI</p>

          <p className="mt-3 text-sm text-zinc-700">
            Seleziona ciò che fai. Puoi aggiungere o togliere skill in qualsiasi momento.
          </p>

          <div className="mt-4 space-y-2">
            {tagsForMacro.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nessuna skill disponibile per questa macro (per ora).
              </p>
            ) : (
              tagsForMacro.map((t) => (
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

          <p className="mt-4 text-xs text-zinc-500">
            Se non trovi una skill, la aggiungeremo nel catalogo (admin).
          </p>
        </div>
      </div>
    </main>
  );
}
