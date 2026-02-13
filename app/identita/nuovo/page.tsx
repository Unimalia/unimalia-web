"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "public"; // cambia solo se il tuo bucket ha un altro nome
const PROFILE_FOLDER = "animal-profiles";

function humanError(msg?: string) {
  const m = (msg || "").toLowerCase();

  if (m.includes("permission") || m.includes("row level security")) {
    return "Non hai i permessi per eseguire questa operazione. Fai login e riprova.";
  }

  if (m.includes("storage") || m.includes("bucket") || m.includes("object")) {
    return "Errore nel caricamento della foto. Riprova.";
  }

  if (m.includes("network") || m.includes("failed") || m.includes("timeout")) {
    return "Problema di connessione. Controlla internet e riprova.";
  }

  return "Si è verificato un errore. Riprova tra poco.";
}

function extFromFile(file: File) {
  const name = file.name || "";
  const i = name.lastIndexOf(".");
  if (i >= 0) return name.slice(i + 1).toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export default function NuovoProfiloAnimalePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  const [photoUrl, setPhotoUrl] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadPhoto(file: File | null) {
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Seleziona un file immagine (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Immagine troppo grande. Usa una foto sotto gli 8MB.");
      return;
    }

    setUploading(true);

    try {
      const ext = extFromFile(file);
      const fileName = `animal_${Date.now()}_${Math.random()
        .toString(16)
        .slice(2)}.${ext}`;

      const path = `${PROFILE_FOLDER}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      if (!data?.publicUrl) {
        throw new Error("public_url_missing");
      }

      setPhotoUrl(data.publicUrl);
    } catch (e: any) {
      setError(humanError(e?.message));
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setError(null);

    const cleanName = name.trim();
    const cleanSpecies = species.trim();

    if (!cleanName) {
      setError("Inserisci il nome dell’animale.");
      return;
    }

    if (!cleanSpecies) {
      setError("Seleziona il tipo animale (Cane, Gatto, ecc.).");
      return;
    }

    if (!photoUrl) {
      setError("Per creare il profilo devi caricare una foto.");
      return;
    }

    setSaving(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { error: insertError } = await supabase.from("animals").insert({
        owner_id: user.id,
        name: cleanName,
        species: cleanSpecies,
        breed: breed.trim() || null,
        color: color.trim() || null,
        size: size.trim() || null,
        photo_url: photoUrl,
        status: "home",
      });

      if (insertError) throw new Error(insertError.message);

      router.push("/identita");
    } catch (e: any) {
      setError(humanError(e?.message));
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
        <Link
          href="/identita"
          className="text-sm text-zinc-600 hover:underline"
        >
          ← Torna
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Nome *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="Es. Zara"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Tipo animale *</span>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
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

          <label className="grid gap-2">
            <span className="text-sm font-medium">Taglia</span>
            <input
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>

        {/* FOTO */}
        <div className="mt-6">
          <h2 className="text-base font-semibold">Foto *</h2>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
              <img
                src={photoUrl || "/placeholder-animal.jpg"}
                alt="Anteprima"
                className="h-56 w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/placeholder-animal.jpg";
                }}
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="rounded-lg bg-black px-4 py-2 text-center text-sm font-semibold text-white hover:bg-zinc-800 cursor-pointer">
                {uploading ? "Caricamento…" : "Sfoglia e carica foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    uploadPhoto(e.target.files?.[0] ?? null)
                  }
                  disabled={uploading}
                />
              </label>

              <p className="text-xs text-zinc-500">
                Formati consigliati: JPG/PNG/WebP. Max 8MB.
              </p>

              {!photoUrl && (
                <p className="text-sm font-medium text-red-700">
                  Per creare il profilo devi caricare una foto.
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={saving || uploading}
            className="rounded-lg bg-black px-5 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Salvataggio…" : "Crea profilo"}
          </button>
        </div>
      </div>
    </main>
  );
}
