"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Turnstile } from "@marsidev/react-turnstile";
import LocationPicker from "../../_components/LocationPicker";

type ContactMode = "protected" | "phone_public";

export default function NuovoSmarrimentoClient() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

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

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => !loading && !uploadingPhoto, [loading, uploadingPhoto]);

  function onPhotoChange(file: File | null) {
    setPhoto(file);

    if (!file) {
      setPhotoPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  async function uploadPhoto(): Promise<string> {
    if (!photo) {
      throw new Error("Carica una foto dell’animale.");
    }

    if (!turnstileToken) {
      throw new Error("Completa il controllo di sicurezza prima di caricare la foto.");
    }

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("file", photo);
      formData.append("turnstileToken", turnstileToken);

      const uploadRes = await fetch("/api/reports/upload-photo", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok) {
        throw new Error(uploadData?.error || "Errore upload foto.");
      }

      if (!uploadData?.publicUrl) {
        throw new Error("Foto caricata ma URL non disponibile.");
      }

      return uploadData.publicUrl as string;
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg(null);

    if (!animalName.trim()) {
      setResultMsg("Inserisci il nome dell’animale.");
      return;
    }

    if (!photo) {
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

    try {
      const uploadedPhotoUrl = await uploadPhoto();

      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lost",
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
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setResultMsg(data?.error || "Errore pubblicazione.");
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
      setTurnstileToken(null);
    } catch (error: any) {
      setResultMsg(error?.message || "Errore di rete o server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-zinc-900">Pubblica smarrimento</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Inserisci i dati essenziali, carica una foto e conferma via email per pubblicare l’annuncio.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Nome animale
          <input
            value={animalName}
            onChange={(e) => setAnimalName(e.target.value)}
            placeholder="Es. Leo"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Specie
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium"
          >
            <option value="cane">Cane</option>
            <option value="gatto">Gatto</option>
            <option value="altro">Altro</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Foto animale
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
            className="block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            required
          />
          <span className="text-xs font-normal text-zinc-500">
            La foto è obbligatoria: aiuta moltissimo il riconoscimento.
          </span>
        </label>

        {photoPreview ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="relative h-64 w-full">
              <Image
                src={photoPreview}
                alt="Anteprima foto animale"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Data smarrimento
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
            required
          />
        </label>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold text-zinc-900">Posizione</div>
          <p className="mt-1 text-xs text-zinc-600">
            Cerca il luogo e, se serve, sposta il pin nel punto esatto.
          </p>

          <div className="mt-3">
            <LocationPicker
              apiKey={apiKey}
              value={coords}
              onChange={setCoords}
              onAddress={(a: any) => {
                if (a.formattedAddress) setLocationText(a.formattedAddress);
                if (a.province) setProvince(a.province);
                if (a.region) setRegion(a.region);
              }}
            />
          </div>

          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
            <div>
              <span className="font-semibold">Luogo:</span>{" "}
              {locationText || "non selezionato"}
            </div>
            <div className="mt-1">
              <span className="font-semibold">Provincia:</span>{" "}
              {province || "—"}{" "}
              <span className="ml-3 font-semibold">Regione:</span>{" "}
              {region || "—"}
            </div>
            <div className="mt-1">
              <span className="font-semibold">Coordinate:</span>{" "}
              {coords.lat != null && coords.lng != null
                ? `${coords.lat}, ${coords.lng}`
                : "non selezionate"}
            </div>
          </div>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Descrizione (opzionale)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Segni particolari, collare, ultime informazioni utili..."
            className="min-h-[100px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Email
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="tu@email.it"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Telefono (opzionale)
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+39..."
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Modalità contatto
          <select
            value={contactMode}
            onChange={(e) => setContactMode(e.target.value as ContactMode)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium"
          >
            <option value="protected">Contatto protetto (consigliato)</option>
            <option value="phone_public">Mostra telefono pubblicamente</option>
          </select>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            Accetto informativa privacy e autorizzo la pubblicazione dell’annuncio secondo le opzioni selezionate.
          </span>
        </label>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-zinc-900">Controllo sicurezza</p>

          {!turnstileSiteKey ? (
            <p className="text-sm text-red-700">
              Chiave Turnstile mancante. Controlla NEXT_PUBLIC_TURNSTILE_SITE_KEY.
            </p>
          ) : (
            <>
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
              <p className="mt-3 text-xs text-zinc-600">
                Stato sicurezza:{" "}
                <span className="font-semibold">
                  {turnstileToken ? "verificato" : "non verificato"}
                </span>
              </p>
            </>
          )}
        </div>

        <button
          disabled={!canSubmit}
          className="h-11 rounded-xl bg-black text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading
            ? "Pubblicazione..."
            : uploadingPhoto
            ? "Caricamento foto..."
            : "Invia e verifica email"}
        </button>

        {resultMsg ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-800">
            {resultMsg}
          </div>
        ) : null}
      </form>
    </div>
  );
}