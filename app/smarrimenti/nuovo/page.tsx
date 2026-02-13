"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AnimalRow = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  status: string;
};

type Mode = "rapido" | "profilo";

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Errore “umano” per errori DB/tecnici
function humanizeSupabaseError(message?: string) {
  const msg = (message || "").toLowerCase();

  // foto obbligatoria (NOT NULL)
  if (msg.includes("primary_photo_url") && msg.includes("not-null")) {
    return "Per pubblicare l’annuncio devi inserire una foto (URL).";
  }

  // login / permessi
  if (msg.includes("jwt") || msg.includes("auth") || msg.includes("permission")) {
    return "Sessione scaduta o permessi insufficienti. Fai login e riprova.";
  }

  // rete / timeout
  if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("timeout")) {
    return "Problema di connessione. Controlla internet e riprova.";
  }

  // fallback
  return "Si è verificato un errore durante la pubblicazione. Riprova tra poco.";
}

export default function NuovoSmarrimentoPage() {
  const router = useRouter();
  const params = useSearchParams();

  const preselectedAnimalId = params.get("animal_id") || "";

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("rapido");

  // Profilo animale
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [animalId, setAnimalId] = useState(preselectedAnimalId);

  // Campi smarrimento
  const [species, setSpecies] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [breed, setBreed] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [lostDate, setLostDate] = useState(todayIso);

  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Foto (URL per ora) — ORA OBBLIGATORIA
  const [primaryPhotoUrl, setPrimaryPhotoUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se arriva animal_id via query, passa automaticamente a "profilo"
  useEffect(() => {
    if (preselectedAnimalId) setMode("profilo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check login + carica animali + prefill email
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

      // Prefill email (modificabile e cancellabile)
      setContactEmail((prev) => prev || (u.email ?? ""));

      const { data: rows, error: e2 } = await supabase
        .from("animals")
        .select("id,name,species,breed,status")
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

  // Precompilo specie+nome+razza (EDITABILI) se modalità profilo
  useEffect(() => {
    if (mode !== "profilo") return;
    if (!selectedAnimal) return;

    setSpecies((prev) => prev || selectedAnimal.species || "");
    setAnimalName((prev) => prev || selectedAnimal.name || "");
    setBreed((prev) => prev || selectedAnimal.breed || "");
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

  function validatePhotoUrl(url: string) {
    const u = url.trim();
    if (!u) return "Per pubblicare l’annuncio devi inserire una foto (URL).";
    // accettiamo anche URL Supabase firmati / path lunghi; controllo leggero
    const isHttp = u.startsWith("http://") || u.startsWith("https://");
    const isRelative = u.startsWith("/"); // se in futuro userai path interni
    if (!isHttp && !isRelative) return "Il link della foto non sembra valido. Usa un URL che inizi con https://";
    return null;
  }

  async function submit() {
    if (!userId) return;

    setError(null);

    const sp = species.trim();
    const desc = description.trim();
    const c = city.trim();
    const p = province.trim();
    const photo = primaryPhotoUrl.trim();

    // ✅ errori “umani”
    if (!sp) return setError("Seleziona il tipo animale (es. Cane, Gatto…).");
    if (mode === "profilo" && !animalId) return setError("Seleziona un profilo animale.");
    if (!animalName.trim()) {
      // nome non obbligatorio nel tuo requisito, quindi NON blocco
      // (se vuoi renderlo obbligatorio dimmelo)
    }
    if (!c) return setError("Inserisci la città.");
    if (!lostDate) return setError("Inserisci la data dello smarrimento.");
    if (desc.length < 10) return setError("Descrizione troppo corta. Scrivi almeno 10 caratteri.");
    const photoErr = validatePhotoUrl(photo);
    if (photoErr) return setError(photoErr);

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

        // ✅ ORA SEMPRE valorizzata (obbligatoria)
        primary_photo_url: photo,

        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
        status: "active",
      };

      if (mode === "profilo") payload.animal_id = animalId;

      const { data: ev, error: e1 } = await supabase
        .from("lost_events")
        .insert(payload)
        .select("id")
        .single();

      if (e1 || !ev?.id) {
        throw new Error(e1?.message || "publish_failed");
      }

      if (mode === "profilo" && animalId) {
        const { error: e2 } = await supabase
          .from("animals")
          .update({ status: "lost" })
          .eq("id", animalId);

        if (e2) {
          // non blocco la pubblicazione, ma loggo
          console.warn("Impossibile aggiornare status animale:", e2.message);
        }
      }

      router.push(`/smarrimenti/${ev.id}`);
    } catch (err: any) {
      setError(humanizeSupabaseError(err?.message));
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <main className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Pubblica smarrimento</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Pubblica smarrimento</h1>
        <Link href="/miei-annunci" className="text-sm text-zinc-600 hover:underline">
          ← I miei annunci
        </Link>
      </div>

      <p className="mt-3 text-zinc-700">
        Puoi pubblicare uno smarrimento in modalità rapida oppure collegarlo a un profilo animale registrato.
      </p>

      <div className="mt-6 flex gap-2">
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

      {mode === "profilo" && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Seleziona un profilo animale</h2>

          {animals.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-700">
              Non hai ancora creato profili animali.{" "}
              <Link href="/identita/nuovo" className="font-medium underline">
                Crea un profilo
              </Link>
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              <select
                value={animalId}
                onChange={(e) => setAnimalId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
              >
                <option value="">Seleziona…</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.species}
                    {a.breed ? ` (${a.breed})` : ""}
                  </option>
                ))}
              </select>

              {selectedAnimal && (
                <p className="text-xs text-zinc-500">
                  Collegato a: <span className="font-medium">{selectedAnimal.name}</span>. Puoi modificare i campi prima di pubblicare.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
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
            <span className="text-sm font-medium">Nome (opzionale)</span>
            <input
              value={animalName}
              onChange={(e) => setAnimalName(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="Es. Zara"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Razza (opzionale)</span>
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="Es. Incrocio"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Data smarrimento *</span>
            <input
              type="date"
              value={lostDate}
              onChange={(e) => setLostDate(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Descrizione *</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              rows={4}
              placeholder="Segni particolari, collare, taglia, carattere, zona precisa, ecc."
            />
            <p className="text-xs text-zinc-500">
              Se compili la razza, verrà inserita automaticamente all’inizio della descrizione (puoi sempre modificarla).
            </p>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Città *</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="Es. Firenze"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Provincia</span>
            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="Es. FI"
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Foto (URL per ora) *</span>
            <input
              value={primaryPhotoUrl}
              onChange={(e) => setPrimaryPhotoUrl(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="https://..."
            />
            <p className="text-xs text-zinc-500">
              Per pubblicare l’annuncio è obbligatorio inserire una foto (URL).
            </p>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Telefono</span>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="+39..."
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Email</span>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="nome@email.it"
            />
          </label>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Smarrimenti sempre gratuiti. Se colleghi un profilo animale, lo stato verrà aggiornato automaticamente.
          </p>

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-black px-5 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Pubblico…" : "Pubblica smarrimento"}
          </button>
        </div>
      </div>
    </main>
  );
}
