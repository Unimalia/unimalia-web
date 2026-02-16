"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "animal-photos";
const PROFILE_FOLDER = "profiles";

function humanError(msg?: string) {
  const m = (msg || "").toLowerCase();

  if (m.includes("permission") || m.includes("row level security") || m.includes("not authorized")) {
    return "Non hai i permessi per eseguire questa operazione. Fai login e riprova.";
  }

  if (m.includes("bucket") && (m.includes("not found") || m.includes("missing"))) {
    return "Configurazione foto non corretta (bucket non trovato). Contatta l’assistenza UNIMALIA.";
  }

  if (m.includes("mime") || m.includes("content-type")) {
    return "Formato immagine non supportato. Usa JPG, PNG o WebP.";
  }

  if (m.includes("network") || m.includes("failed") || m.includes("timeout")) {
    return "Problema di connessione. Controlla internet e riprova.";
  }

  // default
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

function normalizeChip(raw: string) {
  return (raw || "")
    .trim()
    .replace(/^microchip[:\s]*/i, "")
    .replace(/^chip[:\s]*/i, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9a-zA-Z\-]/g, "");
}

export default function NuovoProfiloAnimalePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  // Microchip: sì/no
  const [hasChip, setHasChip] = useState<"yes" | "no">("no");
  const [chipNumber, setChipNumber] = useState("");

  // Foto
  const [photoUrl, setPhotoUrl] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanedChip = useMemo(() => normalizeChip(chipNumber), [chipNumber]);

  async function uploadPhoto(file: File | null) {
    setError(null);

    if (!file) {
      setError("Seleziona una foto prima di continuare.");
      return;
    }

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
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData.user) {
        router.push("/login");
        return;
      }

      const ext = extFromFile(file);
      const fileName = `animal_${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
      const path = `${PROFILE_FOLDER}/${authData.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      if (uploadError) throw new Error(uploadError.message);

      // NB: getPublicUrl funziona se bucket è Public.
      // Se in futuro rendi privato animal-photos, passeremo a signed URLs.
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

    if (hasChip === "yes") {
      if (!cleanedChip) {
        setError("Hai selezionato microchip: inserisci il numero del microchip.");
        return;
      }
      if (cleanedChip.length < 10) {
        setError("Numero microchip non valido (troppo corto). Controlla e riprova.");
        return;
      }
    }

    setSaving(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const payload: any = {
        owner_id: user.id,
        name: cleanName,
        species: cleanSpecies,
        breed: breed.trim() || null,
        color: color.trim() || null,
        size: size.trim() || null,
        photo_url: photoUrl,
        status: "home",
      };

      // Se ha microchip lo salviamo (NON verificato: lo farà il vet)
      if (hasChip === "yes") {
        payload.chip_number = cleanedChip;
        payload.microchip_verified = false;
      } else {
        payload.chip_number = null;
        payload.microchip_verified = false;
      }

      const { error: insertError } = await supabase.from("animals").insert(payload);
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
        <h1 className="text-3xl font-bold tracking-tight">Crea profilo animale</h1>

        <Link href="/identita" className="text-sm text-zinc-600 hover:underline">
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

        {/* MICROCHIP */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-900">Microchip</p>
          <p className="mt-1 text-sm text-zinc-700">
            Se l’animale ha microchip, quello diventa il suo codice digitale definitivo. Se non ce l’ha, UNIMALIA userà un codice interno.
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="hasChip"
                checked={hasChip === "yes"}
                onChange={() => setHasChip("yes")}
              />
              Sì, ha microchip
            </label>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="hasChip"
                checked={hasChip === "no"}
                onChange={() => {
                  setHasChip("no");
                  setChipNumber("");
                }}
              />
              No, non ha microchip
            </label>
          </div>

          {hasChip === "yes" && (
            <div className="mt-4 grid gap-2">
              <label className="text-sm font-medium">Numero microchip *</label>
              <input
                value={chipNumber}
                onChange={(e) => setChipNumber(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="Es. 380260123456789"
              />
              <p className="text-xs text-zinc-500">
                Per ora inserimento manuale. La verifica verrà fatta dal veterinario.
              </p>
            </div>
          )}

          {hasChip === "no" && (
            <p className="mt-3 text-xs text-zinc-500">
              Verrà assegnato automaticamente un UNIMALIA ID (barcode + QR) utilizzabile dai professionisti.
            </p>
          )}
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
                  (e.currentTarget as HTMLImageElement).src = "/placeholder-animal.jpg";
                }}
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="cursor-pointer rounded-lg bg-black px-4 py-2 text-center text-sm font-semibold text-white hover:bg-zinc-800">
                {uploading ? "Caricamento…" : "Sfoglia e carica foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadPhoto(e.target.files?.[0] ?? null)}
                  disabled={uploading}
                />
              </label>

              <p className="text-xs text-zinc-500">Formati consigliati: JPG/PNG/WebP. Max 8MB.</p>

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
