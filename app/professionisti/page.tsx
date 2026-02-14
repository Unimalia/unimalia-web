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

function isEmailValid(email: string) {
  const e = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

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
  const [website, setWebsite] = useState(""); // opzionale
  const [description, setDescription] = useState(""); // opzionale

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

    // VALIDAZIONI (NON opzionali)
    if (displayName.trim().length < 2) {
      setError("Inserisci un nome valido (minimo 2 caratteri).");
      return;
    }
    if (city.trim().length < 2) {
      setError("Inserisci una città valida.");
      return;
    }
    if (province.trim().length < 2) {
      setError("Inserisci una provincia valida (es. FI, PI, AR).");
      return;
    }
    if (address.trim().length < 5) {
      setError("Inserisci un indirizzo valido (es. Via Roma 10).");
      return;
    }
    if (phone.trim().length < 6) {
      setError("Inserisci un numero di telefono valido.");
      return;
    }
    if (!isEmailValid(email)) {
      setError("Inserisci un indirizzo email valido.");
      return;
    }

    setSaving(true);
    try {
      await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

      const { data: inserted, error } = await supabase
        .from("professionals")
        .insert({
          owner_id: userId,
          approved: false,
          display_name: displayName.trim(),
          category,
          city: city.trim(),
          province: province.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          website: website.trim() || null, // opzionale
          description: description.trim() || null, // opzionale
        })
        .select("id")
        .single();

      if (error) throw error;

      // ✅ dopo creazione → pagina skill dedicata
      router.replace("/professionisti/skill");
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
        <p className="text-sm text-zinc-700">
          Compila i dati principali. Subito dopo sceglierai le <span className="font-semibold">skill</span> (servizi offerti).
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Nome attività / professionista *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Es. Clinica Veterinaria XYZ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Categoria *</label>
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
            <label className="block text-sm font-medium">Città *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Es. Firenze"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Provincia * (es. FI)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="FI"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Indirizzo *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Via Roma 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Telefono *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+39…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email *</label>
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
          {saving ? "Salvataggio..." : "Continua: scegli le skill →"}
        </button>

        <p className="mt-3 text-xs text-zinc-500">* Campi obbligatori</p>
      </div>
    </main>
  );
}
