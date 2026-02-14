"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const MACRO = [
  { key: "veterinari", label: "Veterinari" },
  { key: "toelettatura", label: "Toelettatura" },
  { key: "pensione", label: "Pensioni" },
  { key: "pet_sitter", label: "Pet sitter & Dog walking" },
  { key: "addestramento", label: "Addestramento" },
  { key: "ponte_arcobaleno", label: "Ponte dell’Arcobaleno" },
  { key: "altro", label: "Altro" },
];

export default function NuovoProfessionistaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("veterinari");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function init() {
      setLoading(true);
      setError(null);

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!alive) return;

      setUserId(user.id);

      // se esiste già una scheda, rimanda a modifica
      const { data: existing } = await supabase
        .from("professionals")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        router.replace("/professionisti/modifica");
        return;
      }

      setLoading(false);
    }

    init();
    return () => {
      alive = false;
    };
  }, [router]);

  async function save() {
    setError(null);

    if (!userId) {
      setError("Devi essere loggato per creare una scheda.");
      return;
    }
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
      await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

      const { error } = await supabase.from("professionals").insert({
        owner_id: userId,
        approved: false,
        display_name: displayName.trim(),
        category,
        city: city.trim(),
        province: province.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        description: description.trim() || null,
      });

      if (error) throw error;

      router.replace("/professionisti/modifica");
    } catch (e: any) {
      setError("Errore nel salvataggio. Controlla i campi e riprova.");
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
        <h1 className="text-3xl font-bold tracking-tight">Crea scheda professionista</h1>
        <Link href="/professionisti" className="text-sm font-medium text-zinc-600 hover:underline">
          ← Portale
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Nome attività / professionista</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Es. Clinica Veterinaria XYZ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Categoria</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              placeholder="Es. Firenze"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Provincia (opzionale)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Es. FI"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Indirizzo (opzionale)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Via / numero"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Telefono (opzionale)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+39…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email (opzionale)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Sito (opzionale)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Descrizione (opzionale)</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Servizi, orari, specializzazioni..."
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Salvataggio..." : "Crea scheda"}
        </button>

        <p className="mt-4 text-xs text-zinc-500">
          La scheda sarà visibile pubblicamente dopo approvazione.
        </p>
      </div>
    </main>
  );
}
