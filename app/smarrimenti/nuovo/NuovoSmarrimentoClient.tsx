"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { PageShell } from "@/_components/ui/page-shell";
import { ButtonPrimary, ButtonSecondary } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import LocationPicker from "@/_components/maps/location-picker";

type AnimalRow = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  status: string;
  photo_url: string | null;
};

type Mode = "rapido" | "profilo";

const BUCKET = "lost-photos"; // ✅ bucket reale su Supabase
const LOST_FOLDER = "lost-events";

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function extFromFile(file: File) {
  const name = file.name || "";
  const i = name.lastIndexOf(".");
  if (i >= 0) return name.slice(i + 1).toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export default function NuovoSmarrimentoClient() {
  const router = useRouter();
  const params = useSearchParams();

  const preselectedAnimalId = params.get("animal_id") || "";

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("rapido");

  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [animalId, setAnimalId] = useState(preselectedAnimalId);

  // campi
  const [species, setSpecies] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [breed, setBreed] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [lostDate, setLostDate] = useState(todayIso);

  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // POSIZIONE PRECISA
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  // FOTO
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>(""); // URL pubblico su Supabase (necessario per submit)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>(""); // preview immediata
  const [uploading, setUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gmapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // cleanup objectURL
  useEffect(() => {
    return () => {
      try {
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      } catch {}
    };
  }, [localPreviewUrl]);

  // auto profilo se arriva animal_id
  useEffect(() => {
    if (preselectedAnimalId) setMode("profilo");
  }, [preselectedAnimalId]);

  // login + carica animali
  useEffect(() => {
    let alive = true;

    async function boot() {
      setChecking(true);
      setError(null);

      const { data, error } = await supabase.auth.getUser();
      const u = data.user;

      if (!u || error) {
        router.replace("/login");
        return;
      }

      if (!alive) return;
      setUserId(u.id);

      setContactEmail((prev) => prev || (u.email ?? ""));

      const { data: rows, error: e2 } = await supabase
        .from("animals")
        .select("id,name,species,breed,status,photo_url")
        .eq("owner_id", u.id)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (e2) setAnimals([]);
      else setAnimals((rows as AnimalRow[]) || []);

      setChecking(false);
    }

    boot();
    return () => {
      alive = false;
    };
  }, [router]);

  const selectedAnimal = useMemo(
    () => animals.find((a) => a.id === animalId) || null,
    [animals, animalId]
  );

  // precompila + foto profilo default
  useEffect(() => {
    if (mode !== "profilo") return;
    if (!selectedAnimal) {
      setProfilePhotoUrl("");
      return;
    }

    setSpecies((prev) => prev || selectedAnimal.species || "");
    setAnimalName((prev) => prev || selectedAnimal.name || "");
    setBreed((prev) => prev || selectedAnimal.breed || "");

    const prof = selectedAnimal.photo_url || "";
    setProfilePhotoUrl(prof);

    setPhotoUrl((prev) => prev || prof);
  }, [mode, selectedAnimal]);

  function buildFinalDescription() {
    const d = description.trim();
    const b = breed.trim();
    if (!b) return d;

    const alreadyHasBreed =
      d.toLowerCase().includes("razza:") || d.toLowerCase().includes("razza ");

    if (alreadyHasBreed) return d;

    return `Razza: ${b}\n---\n${d}`;
  }

  async function onPickFile(file: File | null) {
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Seleziona un file immagine (JPG/PNG/WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Immagine troppo grande. Usa una foto sotto gli 8MB.");
      return;
    }

    // preview immediata (anche se upload fallisce)
    try {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    } catch {}
    const preview = URL.createObjectURL(file);
    setLocalPreviewUrl(preview);

    // upload su Supabase
    setUploading(true);
    try {
      const ext = extFromFile(file);
      const name = `lost_${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
      const path = `${LOST_FOLDER}/${name}`;

      const { data: upData, error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      if (upErr) {
        console.error("UPLOAD ERROR:", upErr);
        throw new Error(
          `[storage.upload] ${upErr.message}${
            (upErr as any)?.statusCode ? ` (status ${(upErr as any).statusCode})` : ""
          }`
        );
      }

      if (!upData?.path) {
        throw new Error("[storage.upload] upload_ok_but_missing_path");
      }

      // getPublicUrl non espone error nei tipi attuali
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(upData.path);
      const url = pub?.publicUrl;

      if (!url) throw new Error("[storage.getPublicUrl] public_url_missing");

      setPhotoUrl(url);
    } catch (e: any) {
      setPhotoUrl("");
      setError(e?.message || "Errore nel caricamento della foto.");
    } finally {
      setUploading(false);
    }
  }

  function useProfilePhoto() {
    if (!profilePhotoUrl) return;

    try {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    } catch {}

    setLocalPreviewUrl("");
    setPhotoUrl(profilePhotoUrl);
    setError(null);
  }

  async function useMyLocation() {
    setError(null);

    if (typeof window === "undefined") return;
    if (!("geolocation" in navigator)) {
      setError("Geolocalizzazione non disponibile su questo dispositivo/browser.");
      return;
    }

    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      setLat(Number(pos.coords.latitude.toFixed(6)));
      setLng(Number(pos.coords.longitude.toFixed(6)));
    } catch (e: any) {
      const code = e?.code;
      if (code === 1) setError("Permesso negato. Consenti la posizione e riprova.");
      else if (code === 3) setError("Timeout geolocalizzazione. Riprova.");
      else setError("Non riesco a ottenere la posizione. Riprova o cerca l’indirizzo.");
    } finally {
      setLocating(false);
    }
  }

  function clearLocation() {
    setLat(null);
    setLng(null);
  }

  async function submit() {
    if (!userId) return;

    setError(null);

    const sp = species.trim();
    const desc = description.trim();
    const c = city.trim();
    const p = province.trim();

    if (!sp) return setError("Seleziona il tipo animale (es. Cane, Gatto…).");
    if (mode === "profilo" && !animalId) return setError("Seleziona un profilo animale.");
    if (!c) return setError("Inserisci la città.");
    if (!lostDate) return setError("Inserisci la data dello smarrimento.");
    if (desc.length < 10) return setError("Descrizione troppo corta. Scrivi almeno 10 caratteri.");

    if (!photoUrl) return setError("Per pubblicare l’annuncio devi caricare una foto (upload completato).");

    setSaving(true);

    try {
      const payload: any = {
        reporter_id: userId,
        species: sp,
        animal_name: animalName.trim() || null,
        description: buildFinalDescription(),
        city: c,
        province: p || null,
        lost_date: lostDate,
        primary_photo_url: photoUrl,
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
        status: "active",
        lat: lat,
        lng: lng,
      };

      if (mode === "profilo") payload.animal_id = animalId;

      const { data: ev, error: e1 } = await supabase
        .from("lost_events")
        .insert(payload)
        .select("id")
        .single();

      if (e1 || !ev?.id) throw new Error(e1?.message || "publish_failed");

      if (mode === "profilo" && animalId) {
        const { error: e2 } = await supabase
          .from("animals")
          .update({ status: "lost" })
          .eq("id", animalId);

        if (e2) console.warn("Impossibile aggiornare status animale:", e2.message);
      }

      router.push(`/smarrimenti/${ev.id}`);
    } catch (e: any) {
      setError(e?.message || "Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <PageShell
        title="Nuovo smarrimento"
        subtitle="Caricamento…"
        backFallbackHref="/smarrimenti"
        actions={
          <>
            <ButtonSecondary href="/miei-annunci">I miei annunci</ButtonSecondary>
            <ButtonPrimary href="/smarrimenti">Smarrimenti</ButtonPrimary>
          </>
        }
      >
        <div className="text-sm text-zinc-600">Sto preparando la pagina…</div>
      </PageShell>
    );
  }

  const imageSrc = localPreviewUrl || photoUrl || "/placeholder-animal.jpg";

  return (
    <PageShell
      title="Nuovo smarrimento"
      subtitle="Pubblica rapido oppure collega un profilo animale."
      backFallbackHref="/smarrimenti"
      boxed={false}
      actions={
        <>
          <ButtonSecondary href="/miei-annunci">I miei annunci</ButtonSecondary>
          <ButtonPrimary href="/smarrimenti">Smarrimenti</ButtonPrimary>
        </>
      }
    >
      {/* MODE */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("rapido")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "rapido"
              ? "bg-black text-white"
              : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
          }`}
        >
          Smarrimento rapido
        </button>
        <button
          type="button"
          onClick={() => setMode("profilo")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "profilo"
              ? "bg-black text-white"
              : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
          }`}
        >
          Da profilo animale
        </button>
      </div>

      {/* PROFILO */}
      {mode === "profilo" ? (
        <div className="mt-6">
          <Card>
            <h2 className="text-base font-semibold text-zinc-900">Seleziona un profilo animale</h2>

            {animals.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-700">
                Non hai ancora creato profili animali.{" "}
                <Link href="/identita/nuovo" className="font-semibold underline">
                  Crea un profilo
                </Link>
              </p>
            ) : (
              <div className="mt-4 grid gap-3">
                <select
                  value={animalId}
                  onChange={(e) => setAnimalId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleziona…</option>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.species}
                      {a.breed ? ` (${a.breed})` : ""}
                    </option>
                  ))}
                </select>

                {selectedAnimal ? (
                  <p className="text-xs text-zinc-500">
                    Collegato a: <span className="font-semibold">{selectedAnimal.name}</span>.
                  </p>
                ) : null}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* FOTO */}
      <div className="mt-6">
        <Card>
          <h2 className="text-base font-semibold text-zinc-900">Foto *</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
              <img
                src={imageSrc}
                alt="Anteprima foto"
                className="h-56 w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder-animal.jpg";
                }}
              />
            </div>

            <div className="flex flex-col gap-3">
              {mode === "profilo" && profilePhotoUrl ? (
                <button
                  type="button"
                  onClick={useProfilePhoto}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Usa foto profilo
                </button>
              ) : (
                <div className="rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
                  Nessuna foto profilo disponibile.
                </div>
              )}

              <label className="cursor-pointer rounded-lg bg-black px-4 py-2 text-center text-sm font-semibold text-white hover:bg-zinc-800">
                {uploading ? "Caricamento foto…" : "Sfoglia e carica una nuova foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  disabled={uploading}
                />
              </label>

              <div className="text-xs text-zinc-600">
                {localPreviewUrl && !photoUrl ? "Anteprima pronta. Sto caricando su server…" : null}
                {photoUrl ? "Foto caricata ✅" : null}
              </div>

              {!photoUrl ? (
                <p className="text-sm font-semibold text-red-700">
                  Per pubblicare l’annuncio devi caricare una foto (upload completato).
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      {/* DATI + MAPPA */}
      <div className="mt-6">
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-900">Tipo animale *</span>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
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
              <span className="text-sm font-semibold text-zinc-900">Nome (opzionale)</span>
              <input
                value={animalName}
                onChange={(e) => setAnimalName(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                placeholder="Es. Zara"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-900">Razza (opzionale)</span>
              <input
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                placeholder="Es. Incrocio"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-900">Data smarrimento *</span>
              <input
                type="date"
                value={lostDate}
                onChange={(e) => setLostDate(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-semibold text-zinc-900">Descrizione *</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                rows={4}
                placeholder="Segni particolari, collare, taglia, carattere, via/zona precisa, ecc."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-900">Città *</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                placeholder="Es. Firenze"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-900">Provincia</span>
              <input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                placeholder="Es. FI"
              />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold text-zinc-900">Posizione precisa (consigliata)</p>
            <p className="mt-1 text-xs text-zinc-600">
              Cerca un indirizzo e poi trascina il pin nel punto esatto. In alternativa usa la tua posizione.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {locating ? "Recupero posizione…" : "Usa la mia posizione"}
              </button>

              <button
                type="button"
                onClick={clearLocation}
                disabled={locating || (lat == null && lng == null)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                Rimuovi posizione
              </button>
            </div>

            <div className="mt-4">
              <LocationPicker
                apiKey={gmapsKey}
                value={{ lat, lng }}
                onChange={(v) => {
                  setLat(v.lat);
                  setLng(v.lng);
                }}
              />
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">Lat</span>
                <span className="font-mono font-medium text-zinc-900">{lat ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">Lng</span>
                <span className="font-mono font-medium text-zinc-900">{lng ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-900">Telefono</span>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                placeholder="+39..."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-900">Email</span>
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                placeholder="nome@email.it"
              />
            </label>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Smarrimenti sempre gratuiti. Se colleghi un profilo animale, lo stato verrà aggiornato automaticamente.
            </p>

            <button
              type="button"
              onClick={submit}
              disabled={saving || uploading || locating}
              className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {uploading ? "Carico foto…" : saving ? "Pubblico…" : "Pubblica smarrimento"}
            </button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}