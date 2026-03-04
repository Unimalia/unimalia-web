"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
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

function normalizePhone(input: string) {
  const raw = (input || "").replace(/\s+/g, "").trim();
  if (!raw) return "";
  return raw.startsWith("+") ? raw : `+39${raw}`;
}

function isLikelyFullName(s: string) {
  const v = (s || "").trim();
  if (v.length < 5) return false;
  const parts = v.split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

const REQUIRE_PHONE_VERIFIED = false;

function isProfileComplete(p: any) {
  if (!p) return false;

  const fullNameOk = isLikelyFullName(p.full_name ?? "");
  const phoneOk = normalizePhone(p.phone ?? "").length >= 8;
  const cityOk = (p.city ?? "").trim().length >= 2;

  const cf = normalizeCF(p.fiscal_code ?? "");
  const cfOk = !cf || cf.length === 16;

  if (!fullNameOk || !phoneOk || !cityOk || !cfOk) return false;

  if (!REQUIRE_PHONE_VERIFIED) return true;
  return p.phone_verified === true;
}

function withTimeout<T>(p: Promise<T>, ms: number, msg: string) {
  let t: any;
  const timeout = new Promise<T>((_resolve, reject) => {
    t = setTimeout(() => reject(new Error(msg)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}

async function compressImageToJpeg(file: File, maxSide = 1600, quality = 0.85): Promise<File> {
  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Impossibile leggere l’immagine selezionata."));
      el.src = blobUrl;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) throw new Error("Dimensioni immagine non valide.");

    const scale = Math.min(1, maxSide / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas non disponibile.");

    ctx.drawImage(img, 0, 0, tw, th);

    const outBlob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Compressione immagine fallita."))),
        "image/jpeg",
        quality
      );
    });

    return new File([outBlob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export default function NuovoProfiloAnimalePage() {
  const router = useRouter();

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [checkingProfile, setCheckingProfile] = useState(true);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  const [hasChip, setHasChip] = useState<"yes" | "no">("no");
  const [chipNumber, setChipNumber] = useState("");

  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const cleanedChip = useMemo(() => normalizeChip(chipNumber), [chipNumber]);

  useEffect(() => {
    let alive = true;

    async function checkProfile() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/login?next=/identita/nuovo");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name,fiscal_code,phone,phone_verified,city")
        .eq("id", user.id)
        .single();

      if (!alive) return;

      if (!isProfileComplete(data)) {
        router.replace("/profilo?returnTo=/identita/nuovo");
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
    setNotice(null);

    if (!file) return setError("Nessun file selezionato.");
    setSelectedFileName(file.name || "foto");

    if (!file.type.startsWith("image/")) return setError("Seleziona un file immagine valido.");
    if (file.size > 20 * 1024 * 1024) return setError("Immagine troppo grande (max 20MB).");

    setUploading(true);
    setNotice("Caricamento foto in corso…");

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        router.replace("/login?next=/identita/nuovo");
        return;
      }

      const wasAlreadySet = !!photoUrl;

      const compressed = await withTimeout(
        compressImageToJpeg(file, 1600, 0.85),
        15000,
        "Compressione immagine bloccata (timeout 15s)."
      );

      const fileName = `animal_${Date.now()}.jpg`;
      const path = `${PROFILE_FOLDER}/${user.id}/${fileName}`;

      const up = await withTimeout(
        supabase.storage.from(BUCKET).upload(path, compressed, {
          upsert: true,
          contentType: "image/jpeg",
          cacheControl: "3600",
        }),
        45000,
        "Upload bloccato (timeout 45s)."
      );

      if (up.error) {
        setError(`Errore upload foto: ${up.error.message}`);
        setNotice(null);
        return;
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = pub?.publicUrl ? `${pub.publicUrl}?t=${Date.now()}` : "";

      if (!publicUrl) {
        setError("Foto caricata ma URL non disponibile. Controlla bucket public.");
        setNotice(null);
        return;
      }

      setPhotoUrl(publicUrl);
      setNotice(wasAlreadySet ? "Foto aggiornata correttamente ✅" : "Foto caricata correttamente ✅");
    } catch (e: any) {
      setError(e?.message || "Errore durante l’upload foto.");
      setNotice(null);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setError(null);
    setNotice(null);

    if (!name.trim()) return setError("Inserisci il nome.");
    if (!species.trim()) return setError("Seleziona il tipo animale.");
    if (!photoUrl) return setError("Carica una foto.");

    if (hasChip === "yes") {
      if (!cleanedChip) return setError("Inserisci il microchip.");
      if (cleanedChip.length < 10) return setError("Numero microchip non valido.");
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
    } catch (e: any) {
      setError(e?.message || "Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  function openFilePicker() {
    fileRef.current?.click();
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
              <input type="radio" checked={hasChip === "yes"} onChange={() => setHasChip("yes")} /> Sì
            </label>
            <label>
              <input type="radio" checked={hasChip === "no"} onChange={() => setHasChip("no")} /> No
            </label>
          </div>

          {hasChip === "yes" && (
            <div className="mt-3 space-y-2">
              <input
                placeholder="Numero microchip *"
                value={chipNumber}
                onChange={(e) => setChipNumber(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />

              {/* UI pronta per il futuro: bottone scansione (lo colleghiamo dopo) */}
              <button
                type="button"
                onClick={() => router.push("/professionisti/scansiona")}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
              >
                📷 Scansiona microchip
              </button>

              <p className="text-xs text-zinc-500">
                Puoi scansionare il codice a barre del microchip con la fotocamera.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              uploadPhoto(f);
              // reset: permette di riselezionare lo stesso file e far scattare l’evento sempre
              e.currentTarget.value = "";
            }}
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openFilePicker}
              className="rounded-lg bg-black px-4 py-2 text-white hover:bg-zinc-900"
            >
              {uploading ? "Caricamento…" : photoUrl ? "Modifica foto" : "Carica foto"}
            </button>

            {selectedFileName ? (
              <span className="text-xs text-zinc-600 truncate">{selectedFileName}</span>
            ) : null}
          </div>

          {notice ? <p className="text-xs text-emerald-700">{notice}</p> : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button onClick={submit} disabled={saving} className="rounded-lg bg-black px-5 py-3 text-white">
            {saving ? "Salvataggio…" : "Crea profilo"}
          </button>
        </div>
      </div>
    </main>
  );
}