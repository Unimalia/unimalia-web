"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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

// FUTURO SMS: metti true quando attivi verifica
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
    setPhotoUrl("");

    if (!file) return setError("Nessun file selezionato.");
    setSelectedFileName(file.name || "foto");
    if (!file.type.startsWith("image/")) return setError("Seleziona un file immagine valido.");
    if (file.size > 8 * 1024 * 1024) return setError("Immagine troppo grande (max 8MB).");

    setUploading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || "";
      if (!token) {
        router.replace("/login?next=/identita/nuovo");
        return;
      }

      const fd = new FormData();
      fd.append("file", file);

      const res = await withTimeout(
        fetch("/api/upload/animal-photo", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }),
        30000,
        "Upload bloccato (timeout 30s)."
      );

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setError(json?.error || "Errore upload foto.");
        return;
      }

      const url = String(json?.publicUrl || "");
      if (!url) {
        setError("Foto caricata ma URL non disponibile.");
        return;
      }

      setPhotoUrl(url);
    } catch (e: any) {
      console.error("UPLOAD VIA API ERROR:", e);
      setError(e?.message || "Errore durante l’upload.");
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
      console.error("ANIMAL INSERT ERROR:", e);
      setError(e?.message || "Errore nel salvataggio. Riprova.");
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
              <input type="radio" checked={hasChip === "yes"} onChange={() => setHasChip("yes")} />{" "}
              Sì
            </label>
            <label>
              <input type="radio" checked={hasChip === "no"} onChange={() => setHasChip("no")} />{" "}
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

        <div className="mt-6 flex flex-col gap-2">
          <input
            ref={fileRef}
            id="animal-photo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              uploadPhoto(f);
              e.currentTarget.value = "";
            }}
          />

          <div className="flex items-center gap-3">
            <label htmlFor="animal-photo" className="cursor-pointer rounded-lg bg-black px-4 py-2 text-white">
              {uploading ? "Caricamento…" : photoUrl ? "Foto caricata ✅ (cambia)" : "Carica foto"}
            </label>

            {selectedFileName ? (
              <span className="text-xs text-zinc-600 truncate">{selectedFileName}</span>
            ) : null}
          </div>

          {photoUrl ? <p className="text-xs text-emerald-700">Foto caricata correttamente ✅</p> : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
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