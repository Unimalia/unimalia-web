"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "animal-photos";

function normalizeChip(raw: string) {
  return (raw || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^0-9a-zA-Z\-]/g, "");
}

export default function ModificaAnimalePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [chipNumber, setChipNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        router.replace("/login?next=/identita/" + id);
        return;
      }

      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error || !data) {
        setMsg("Profilo non trovato.");
        setLoading(false);
        return;
      }

      if (data.owner_id !== user.id) {
        router.replace("/identita");
        return;
      }

      setName(data.name || "");
      setSpecies(data.species || "");
      setBreed(data.breed || "");
      setColor(data.color || "");
      setSize(data.size || "");
      setChipNumber(data.chip_number || "");
      setPhotoUrl(data.photo_url || "");

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, router]);

  async function uploadPhoto(file: File | null) {
    if (!file) return;

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `profiles/${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true });

    if (error) {
      setMsg("Errore nel caricamento foto.");
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
  }

  async function save() {
    setMsg(null);

    if (!name.trim()) return setMsg("Inserisci il nome.");
    if (!species.trim()) return setMsg("Inserisci il tipo animale.");

    setSaving(true);

    try {
      const { error } = await supabase
        .from("animals")
        .update({
          name: name.trim(),
          species: species.trim(),
          breed: breed.trim() || null,
          color: color.trim() || null,
          size: size.trim() || null,
          chip_number: chipNumber ? normalizeChip(chipNumber) : null,
        })
        .eq("id", id);

      if (error) throw error;

      router.replace(`/identita/${id}`);
    } catch {
      setMsg("Errore nel salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Modifica profilo</h1>
        <p className="mt-4">Caricamento…</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Modifica profilo animale
        </h1>
        <Link
          href={`/identita/${id}`}
          className="text-sm text-zinc-600 hover:underline"
        >
          ← Torna
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Nome *</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Tipo animale *</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Razza</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Colore / segni</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Taglia</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Microchip</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            value={chipNumber}
            onChange={(e) => setChipNumber(e.target.value)}
          />
        </label>

        <div>
          <span className="text-sm font-medium">Foto</span>
          <div className="mt-2">
            <img
              src={photoUrl || "/placeholder-animal.jpg"}
              className="h-40 rounded-lg border"
            />
          </div>

          <label className="mt-3 inline-block cursor-pointer rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800">
            Cambia foto
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => uploadPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {msg && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            {msg}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-black px-5 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Salvataggio…" : "Salva modifiche"}
          </button>
        </div>
      </div>
    </main>
  );
}
