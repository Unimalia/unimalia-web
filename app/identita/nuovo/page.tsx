"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NuovoAnimalePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  const errorMsg = useMemo(() => {
    const e = params.get("errore");
    if (e === "campi") return "Compila almeno Nome e Tipo animale.";
    if (e === "salvataggio") return "Errore nel salvataggio. Riprova.";
    return "";
  }, [params]);

  useEffect(() => {
    let isMounted = true;
    async function check() {
      const { data, error } = await supabase.auth.getUser();
      if (!data?.user || error) {
        router.replace("/login");
        return;
      }
      if (!isMounted) return;
      setUserId(data.user.id);
      setChecking(false);
    }
    check();
    return () => {
      isMounted = false;
    };
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;

    const n = name.trim();
    const s = species.trim();
    if (!n || !s) {
      router.replace("/identita/nuovo?errore=campi");
      return;
    }

    setSaving(true);

    const premium_expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("animals")
      .insert({
        owner_id: userId,
        name: n,
        species: s,
        breed: breed.trim() || null,
        color: color.trim() || null,
        size: size.trim() || null,
        status: "home",
        premium_active: true,
        premium_expires_at,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      router.replace("/identita/nuovo?errore=salvataggio");
      return;
    }

    router.push(`/identita/${data.id}`);
  }

  if (checking) {
    return (
      <main className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Crea profilo animale</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Crea profilo animale</h1>
        <Link href="/identita" className="text-sm text-zinc-600 hover:underline">
          ← Torna
        </Link>
      </div>

      <p className="mt-4 text-zinc-700">
        Crea il profilo digitale del tuo animale. Il profilo completo è attualmente gratuito.
      </p>

      {errorMsg ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Nome *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="Es. Luna"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Tipo animale *</span>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="">Seleziona…</option>
              <option value="Cane">Cane</option>
              <option value="Gatto">Gatto</option>
              <option value="Pappagallo">Pappagallo</option>
              <option value="Coniglio">Coniglio</option>
              <option value="Altro">Altro</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Razza</span>
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Colore / segni</span>
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Taglia</span>
            <input
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="Piccola / Media / Grande"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Microchip e cartella clinica saranno disponibili in futuro tramite professionisti autorizzati.
          </p>

          <button
            disabled={saving}
            className="rounded-lg bg-black px-5 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Creo…" : "Crea profilo"}
          </button>
        </div>
      </form>
    </main>
  );
}
