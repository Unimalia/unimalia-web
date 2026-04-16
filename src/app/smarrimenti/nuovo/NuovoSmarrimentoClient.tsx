"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LocationPicker from "../../_components/LocationPicker";

type ContactMode = "protected" | "phone_public";

type SubmitStage = "idle" | "uploading-photo" | "creating-report";

type AddressPayload = {
  formattedAddress?: string | null;
  province?: string | null;
  region?: string | null;
};

type UploadPhotoResponse = {
  error?: string;
  publicUrl?: string;
};

type CreateReportResponse = {
  error?: string;
  report?: {
    claim_token?: string;
  };
};

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function normalizeSpecies(value: string | null | undefined) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "cane") return "cane";
  if (v === "gatto") return "gatto";
  return "altro";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className="block text-sm font-semibold text-[#30486f]">{children}</span>;
}

export default function NuovoSmarrimentoClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const animalId = (searchParams.get("animalId") || "").trim();

  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  const [animalName, setAnimalName] = useState("");
  const [species, setSpecies] = useState("cane");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [locationText, setLocationText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMode, setContactMode] = useState<ContactMode>("protected");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [stage, setStage] = useState<SubmitStage>("idle");
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => !loading && !prefilling, [loading, prefilling]);
  const ownerPrefillMode = Boolean(animalId);

  useEffect(() => {
    let alive = true;

    async function prefillFromAnimal() {
      if (!animalId) return;

      setPrefilling(true);
      setResultMsg(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(`/smarrimenti/nuovo?animalId=${animalId}`)}`);
        return;
      }

      const [{ data: animal, error: animalError }, { data: profile }] = await Promise.all([
        supabase.from("animals").select("*").eq("id", animalId).single(),
        supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle(),
      ]);

      if (!alive) return;

      if (animalError || !animal) {
        setResultMsg("Non sono riuscito a caricare i dati dell’animale.");
        setPrefilling(false);
        return;
      }

      if (animal.owner_id !== user.id) {
        setResultMsg("Questo animale non appartiene al tuo profilo.");
        setPrefilling(false);
        return;
      }

      setAnimalName(animal.name || "");
      setSpecies(normalizeSpecies(animal.species));
      setDescription([animal.breed, animal.color, animal.size].filter(Boolean).join(" • "));
      setExistingPhotoUrl(animal.photo_url || null);
      setPhotoPreview(animal.photo_url || null);
      setContactEmail(user.email || "");
      setContactPhone(String(profile?.phone || "").trim());
      setContactMode("protected");

      setPrefilling(false);
    }

    void prefillFromAnimal();

    return () => {
      alive = false;
    };
  }, [animalId, router]);

  function onPhotoChange(file: File | null) {
    setPhoto(file);
    setResultMsg(null);

    if (!file) {
      setPhotoPreview(existingPhotoUrl);
      return;
    }

    const mime = String(file.type || "").toLowerCase();

    if (mime === "image/heic" || mime === "image/heif") {
      setResultMsg(
        "La foto selezionata è in formato HEIC/HEIF (tipico di iPhone). Al momento carica una foto JPG/PNG/WEBP."
      );
    }

    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  async function uploadPhoto(): Promise<string> {
    if (!photo) {
      if (existingPhotoUrl) return existingPhotoUrl;
      throw new Error("Carica una foto dell’animale.");
    }

    if (!turnstileToken) {
      throw new Error("Completa il controllo di sicurezza prima di caricare la foto.");
    }

    const mime = String(photo.type || "").toLowerCase();

    if (mime === "image/heic" || mime === "image/heif") {
      throw new Error(
        "La foto selezionata è in formato HEIC/HEIF (tipico di iPhone). Al momento carica una foto JPG/PNG/WEBP."
      );
    }

    setStage("uploading-photo");

    const formData = new FormData();
    formData.append("file", photo);
    formData.append("turnstileToken", turnstileToken);

    const uploadRes = await withTimeout(
      fetch("/api/reports/upload-photo", {
        method: "POST",
        body: formData,
      }),
      45000,
      "Upload foto troppo lento o non completato. Riprova."
    );

    const uploadData: UploadPhotoResponse = await uploadRes.json().catch(() => ({}));

    if (!uploadRes.ok) {
      throw new Error(uploadData.error || "Errore upload foto.");
    }

    if (!uploadData.publicUrl) {
      throw new Error("Foto caricata ma URL non disponibile.");
    }

    return uploadData.publicUrl;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg(null);

    if (!animalName.trim()) {
      setResultMsg("Inserisci il nome dell’animale.");
      return;
    }

    if (!photo && !existingPhotoUrl) {
      setResultMsg("Carica una foto dell’animale.");
      return;
    }

    if (!locationText.trim() || !province.trim() || !region.trim()) {
      setResultMsg("Seleziona correttamente il luogo sulla mappa.");
      return;
    }

    if (!eventDate) {
      setResultMsg("Inserisci la data dello smarrimento.");
      return;
    }

    if (!consent) {
      setResultMsg("Devi accettare l’informativa per pubblicare l’annuncio.");
      return;
    }

    if (coords.lat == null || coords.lng == null) {
      setResultMsg("Seleziona un punto sulla mappa prima di pubblicare.");
      return;
    }

    if (!contactEmail.trim()) {
      setResultMsg("Inserisci una email valida.");
      return;
    }

    if (!turnstileToken) {
      setResultMsg("Completa il controllo di sicurezza prima di pubblicare.");
      return;
    }

    setLoading(true);
    setStage("uploading-photo");

    try {
      const uploadedPhotoUrl = await uploadPhoto();

      setStage("creating-report");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";

      const res = await withTimeout(
        fetch("/api/reports/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            type: "lost",
            animal_id: animalId || null,
            animal_name: animalName.trim(),
            species: species.trim(),
            region: region.trim(),
            province: province.trim(),
            location_text: locationText.trim(),
            event_date: eventDate,
            description: description.trim() || null,
            photo_urls: [uploadedPhotoUrl],
            contact_email: contactEmail.trim(),
            contact_phone: contactPhone.trim() || null,
            contact_mode: contactMode,
            consent,
            lat: coords.lat,
            lng: coords.lng,
            turnstileToken,
          }),
        }),
        45000,
        "Creazione annuncio troppo lenta o non completata. Riprova."
      );

      const data: CreateReportResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        setResultMsg(data.error || "Errore pubblicazione.");
        return;
      }

      if (ownerPrefillMode && data.report?.claim_token) {
        router.push(`/gestisci-annuncio/${data.report.claim_token}`);
        return;
      }

      setResultMsg(
        "✅ Ti abbiamo inviato una email per verificare l’annuncio. Apri la mail e conferma per metterlo online."
      );

      setAnimalName("");
      setSpecies("cane");
      setRegion("");
      setProvince("");
      setLocationText("");
      setEventDate("");
      setDescription("");
      setContactEmail("");
      setContactPhone("");
      setContactMode("protected");
      setConsent(false);
      setCoords({ lat: null, lng: null });
      setPhoto(null);
      setPhotoPreview(null);
      setExistingPhotoUrl(null);
      setTurnstileToken(null);
      setStage("idle");
    } catch (error: unknown) {
      setResultMsg(getErrorMessage(error, "Errore di rete o server."));
      setStage("idle");
    } finally {
      setLoading(false);
    }
  }

  const submitLabel =
    stage === "uploading-photo"
      ? "Caricamento foto..."
      : stage === "creating-report"
        ? "Pubblicazione..."
        : ownerPrefillMode
          ? "Pubblica smarrimento"
          : "Invia e verifica email";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex w-fit items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Smarrimenti UNIMALIA
              </span>

              <Link
                href="/smarrimenti"
                className="text-sm font-semibold text-[#5f708a] underline-offset-4 transition hover:text-[#30486f] hover:underline"
              >
                ← Torna agli smarrimenti
              </Link>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
              {ownerPrefillMode ? "Segnala come smarrito" : "Pubblica smarrimento"}
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-8 text-[#55657d] sm:text-base">
              {ownerPrefillMode
                ? "Abbiamo precompilato i dati dell’animale registrato. Completa luogo e data dello smarrimento per pubblicare rapidamente l’annuncio."
                : "Inserisci i dati essenziali, aggiungi una foto recente e completa la verifica email per mettere online l’annuncio."}
            </p>

            <form onSubmit={onSubmit} className="mt-8 grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel>Nome animale</FieldLabel>
                  <input
                    value={animalName}
                    onChange={(e) => setAnimalName(e.target.value)}
                    placeholder="Es. Leo"
                    className="h-12 w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 text-sm text-[#30486f] outline-none transition placeholder:text-[#7a8799] focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Specie</FieldLabel>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="h-12 w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 text-sm font-medium text-[#30486f] outline-none transition focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
                  >
                    <option value="cane">Cane</option>
                    <option value="gatto">Gatto</option>
                    <option value="altro">Altro</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <FieldLabel>Foto animale</FieldLabel>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
                  className="block w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 py-3 text-sm text-[#30486f] file:mr-3 file:rounded-xl file:border-0 file:bg-[#eef3f8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#30486f]"
                />
                <span className="text-xs leading-6 text-[#5f708a]">
                  {existingPhotoUrl
                    ? "Puoi tenere la foto già presente oppure sostituirla con una nuova."
                    : "Usa una foto JPG, PNG o WEBP. Su iPhone evita HEIC/HEIF."}
                </span>
              </label>

              {photoPreview ? (
                <div className="overflow-hidden rounded-[24px] border border-[#e3e9f0] bg-[#f8fbff] p-3">
                  <div className="relative h-72 w-full overflow-hidden rounded-[20px] border border-[#dbe5ef] bg-white">
                    <Image
                      src={photoPreview}
                      alt="Anteprima foto animale"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel>Data smarrimento</FieldLabel>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="h-12 w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 text-sm text-[#30486f] outline-none transition focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Modalità contatto</FieldLabel>
                  <select
                    value={contactMode}
                    onChange={(e) => setContactMode(e.target.value as ContactMode)}
                    className="h-12 w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 text-sm font-medium text-[#30486f] outline-none transition focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
                  >
                    <option value="protected">Contatto protetto (consigliato)</option>
                    <option value="phone_public">Mostra telefono pubblicamente</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <FieldLabel>Descrizione (opzionale)</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Segni particolari, collare, ultime informazioni utili..."
                  className="min-h-[120px] w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 py-3 text-sm text-[#30486f] outline-none transition placeholder:text-[#7a8799] focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="tu@email.it"
                    className="h-12 w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 text-sm text-[#30486f] outline-none transition placeholder:text-[#7a8799] focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Telefono (opzionale)</FieldLabel>
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+39..."
                    className="h-12 w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 text-sm text-[#30486f] outline-none transition placeholder:text-[#7a8799] focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
                  />
                </label>
              </div>

              <div className="rounded-[24px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-sm">
                <div className="text-sm font-semibold text-[#30486f]">Posizione</div>
                <p className="mt-2 text-xs leading-6 text-[#5f708a]">
                  Cerca il luogo e, se serve, sposta il pin nel punto esatto.
                </p>

                <div className="mt-4">
                  <LocationPicker
                    apiKey={apiKey}
                    value={coords}
                    onChange={setCoords}
                    onAddress={(a: AddressPayload) => {
                      if (a.formattedAddress) setLocationText(a.formattedAddress);
                      if (a.province) setProvince(a.province);
                      if (a.region) setRegion(a.region);
                    }}
                  />
                </div>

                <div className="mt-4 rounded-[20px] border border-[#dbe5ef] bg-white p-4 text-xs leading-6 text-[#55657d]">
                  <div>
                    <span className="font-semibold text-[#30486f]">Luogo:</span>{" "}
                    {locationText || "non selezionato"}
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold text-[#30486f]">Provincia:</span>{" "}
                    {province || "—"} <span className="ml-3 font-semibold text-[#30486f]">Regione:</span>{" "}
                    {region || "—"}
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold text-[#30486f]">Coordinate:</span>{" "}
                    {coords.lat != null && coords.lng != null
                      ? `${coords.lat}, ${coords.lng}`
                      : "non selezionate"}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-[20px] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm leading-7 text-[#55657d]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Accetto informativa privacy e autorizzo la pubblicazione dell’annuncio secondo le
                  opzioni selezionate.
                </span>
              </label>

              <div className="rounded-[24px] border border-[#e3e9f0] bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#30486f]">Controllo sicurezza</p>

                {!turnstileSiteKey ? (
                  <p className="mt-3 text-sm text-red-700">
                    Chiave Turnstile mancante. Controlla NEXT_PUBLIC_TURNSTILE_SITE_KEY.
                  </p>
                ) : (
                  <>
                    <div className="mt-4">
                      <Turnstile
                        siteKey={turnstileSiteKey}
                        onSuccess={(token) => setTurnstileToken(token)}
                        onExpire={() => setTurnstileToken(null)}
                        onError={() => setTurnstileToken(null)}
                      />
                    </div>
                    <p className="mt-3 text-xs leading-6 text-[#5f708a]">
                      Stato sicurezza:{" "}
                      <span className="font-semibold text-[#30486f]">
                        {turnstileToken ? "verificato" : "non verificato"}
                      </span>
                    </p>
                  </>
                )}
              </div>

              <button
                disabled={!canSubmit}
                className="h-12 rounded-full bg-[#30486f] text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59] disabled:opacity-60"
              >
                {submitLabel}
              </button>

              {resultMsg ? (
                <div className="rounded-[20px] border border-[#e3e9f0] bg-white p-4 text-sm leading-7 text-[#30486f]">
                  {resultMsg}
                </div>
              ) : null}
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-[#dbe5ef] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8 lg:p-10">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Pubblicazione guidata
              </span>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Più chiaro, più veloce, più utile per chi cerca davvero
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
                Un annuncio completo con foto, posizione precisa e recapiti corretti aiuta a rendere
                la segnalazione più affidabile e più efficace.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Foto chiara</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Una foto recente aumenta molto le possibilità che qualcuno riconosca l’animale.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Posizione precisa</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Cerca il luogo e, se serve, sposta il pin per indicare il punto più corretto.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Verifica email</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    L’annuncio viene confermato tramite email per ridurre abusi e mantenere la
                    piattaforma più affidabile.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <span className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Suggerimenti utili
              </span>

              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                Cosa scrivere nell’annuncio
              </h3>

              <ul className="mt-5 list-disc space-y-3 pl-6 text-sm leading-7 text-[#55657d] sm:text-base">
                <li>zona precisa o ultimo avvistamento utile</li>
                <li>collare, pettorina o segni riconoscibili</li>
                <li>caratteristiche fisiche evidenti</li>
                <li>eventuale comportamento dell’animale se spaventato</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h3 className="text-xl font-semibold text-[#30486f]">Pubblicazione gratuita</h3>
              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                Gli smarrimenti su UNIMALIA restano gratuiti. L’obiettivo è aiutare i proprietari a
                pubblicare rapidamente segnalazioni affidabili e facili da consultare.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}