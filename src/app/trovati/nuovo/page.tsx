"use client";

import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import LocationPicker from "../../_components/LocationPicker";

type ReportType = "found" | "sighted";
type ContactMode = "protected" | "phone_public";

export default function NuovoTrovatoPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  const [type, setType] = useState<ReportType>("found");
  const [animalName, setAnimalName] = useState("");
  const [species, setSpecies] = useState("cane");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [locationText, setLocationText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMode, setContactMode] = useState<ContactMode>("protected");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg(null);

    if (!locationText.trim() || !province.trim() || !region.trim()) {
      setResultMsg("Seleziona correttamente il luogo sulla mappa.");
      return;
    }

    if (!eventDate) {
      setResultMsg("Inserisci la data dell’evento.");
      return;
    }

    if (!consent) {
      setResultMsg("Devi accettare l’informativa per pubblicare la segnalazione.");
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
      let photoUrl: string | null = null;

      if (photo) {
        const formData = new FormData();
        formData.append("file", photo);

        const uploadRes = await fetch("/api/upload/animal-photo", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          setResultMsg(uploadData.error || "Errore upload foto");
          setLoading(false);
          return;
        }

        photoUrl = uploadData.publicUrl;
      }

      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          animal_name: animalName.trim() || null,
          species: species.trim(),
          region: region.trim(),
          province: province.trim(),
          location_text: locationText.trim(),
          event_date: eventDate,
          description: description.trim() || null,
          photo_urls: photoUrl ? [photoUrl] : [],
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

      setResultMsg("✅ Segnalazione pubblicata correttamente!");
      setTurnstileToken(null);
    } catch {
      setResultMsg("Errore di rete o server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-zinc-900">Segnala animale trovato / avvistato</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Inserisci i dati essenziali e conferma via email per pubblicare la segnalazione.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Tipo segnalazione
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium"
          >
            <option value="found">Animale trovato</option>
            <option value="sighted">Animale avvistato</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Nome animale (se noto)
          <input
            value={animalName}
            onChange={(e) => setAnimalName(e.target.value)}
            placeholder="Es. Leo"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
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
          Data evento
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
              onAddress={(a) => {
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
          Descrizione
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dove l’hai visto, se è in sicurezza, se ha collare, condizioni apparenti..."
            className="min-h-[100px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Foto (opzionale)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
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
            Accetto informativa privacy e autorizzo la pubblicazione della segnalazione secondo le opzioni selezionate.
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
          disabled={loading}
          className="h-11 rounded-xl bg-black text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Pubblicazione..." : "Pubblica segnalazione"}
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