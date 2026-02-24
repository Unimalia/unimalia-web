"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "animal-photos";
const PROFILE_FOLDER = "profiles";

function normalizeChip(raw: string) {
  return (raw || "")
    .trim()
    .replace(/^microchip[:\s]*/i, "")
    .replace(/^chip[:\s]*/i, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9a-zA-Z\-]/g, "");
}

function normalizeCF(s: string) {
  return (s || "").replace(/\s+/g, "").trim().toUpperCase();
}

function isProfileComplete(p: any) {
  if (!p) return false;

  return (
    p.full_name?.trim()?.length >= 3 &&
    normalizeCF(p.fiscal_code)?.length === 16 &&
    p.address?.trim()?.length >= 5 &&
    p.city?.trim()?.length >= 2 &&
    p.province?.trim()?.length === 2 &&
    p.cap?.trim()?.length === 5
  );
}

export default function NuovoProfiloAnimalePage() {
  const router = useRouter();

  const [checkingProfile, setCheckingProfile] = useState(true);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  const [hasChip, setHasChip] = useState<"yes" | "no">("no");
  const [chipNumber, setChipNumber] = useState("");

  const [photoUrl, setPhotoUrl] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanedChip = useMemo(() => normalizeChip(chipNumber), [chipNumber]);

  // 🔹 CONTROLLO PROFILO COMPLETO
  useEffect(() => {
    let alive = true;

    async function checkProfile() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name,fiscal_code,address,city,province,cap")
        .eq("id", user.id)
        .single();

      if (!alive) return;

      if (!isProfileComplete(data)) {
        router.replace("/profilo");
        return;
      }

      setCheckingProfile(false);
    }

    checkProfile();
    return () => {
      alive = false;
    };
  }, [router]);

  if (checkingProfile) {
    return (
      <main className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Crea profilo animale</h1>
        <p className="mt-4 text-zinc-700">Controllo profilo in corso…</p>
      </main>
    );
  }

  async function uploadPhoto(file: File | null) {
    setError(null);

    if (!file) return setError("Seleziona una foto prima di continuare.");
    if (!file.type.startsWith("image/"))
      return setError("Seleziona un file immagine valido.");
    if (file.size > 8 * 1024 * 1024)
      return setError("Immagine troppo grande (max 8MB).");

    setUploading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push("/login");
        return;
      }

      const fileName = `animal_${Date.now()}.jpg`;
      const path = `${PROFILE_FOLDER}/${authData.user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch {
      setError("Errore nel caricamento della foto. Riprova.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setError(null);

    if (!name.trim()) return setError("Inserisci il nome.");
    if (!species.trim()) return setError("Seleziona il tipo animale.");
    if (!photoUrl) return setError("Carica una foto.");

    if (hasChip === "yes") {
      if (!cleanedChip) return setError("Inserisci il microchip.");
      if (cleanedChip.length < 10)
        return setError("Numero microchip non valido.");
    }

    setSaving(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      const payload: any = {
        owner_id: user?.id,
        name: name.trim(),
        species: species.trim(),
        breed: breed.trim() || null,
        color: color.trim() || null,
        size: size.trim() || null,
        photo_url: photoUrl,
        status: "home",
        chip_number: hasChip === "yes" ? cleanedChip : null,
        microchip_verified: false,
      };

      const { error } = await supabase.from("animals").insert(payload);
      if (error) throw error;

      router.push("/identita");
    } catch {
      setError("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Crea profilo animale
        </h1>
        <Link href="/identita" className="text-sm text-zinc-600 hover:underline">
          ← Torna
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            placeholder="Nome *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />

          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          >
            <option value="">Tipo animale *</option>
            <option value="Cane">Cane</option>
            <option value="Gatto">Gatto</option>
            <option value="Altro">Altro</option>
          </select>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold">Microchip</p>

          <div className="mt-2 flex gap-4 text-sm">
            <label>
              <input
                type="radio"
                checked={hasChip === "yes"}
                onChange={() => setHasChip("yes")}
              />{" "}
              Sì
            </label>
            <label>
              <input
                type="radio"
                checked={hasChip === "no"}
                onChange={() => setHasChip("no")}
              />{" "}
              No
            </label>
          </div>

          {hasChip === "yes" && (
            <input
              placeholder="Numero microchip *"
              value={chipNumber}
              onChange={(e) => setChipNumber(e.target.value)}
              className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          )}
        </div>

        <div className="mt-6">
          <label className="cursor-pointer rounded-lg bg-black px-4 py-2 text-white">
            {uploading ? "Caricamento…" : "Carica foto"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => uploadPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-black px-5 py-3 text-white"
          >
            {saving ? "Salvataggio…" : "Crea profilo"}
          </button>
        </div>
      </div>
    </main>
  );
}
