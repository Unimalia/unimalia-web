"use client";

import { useState } from "react";
import MapsWithConsent from "../../_components/MapsWithConsent";
import LocationPicker from "../../_components/LocationPicker";

type ReportType = "lost" | "found" | "sighted";
type ContactMode = "protected" | "phone_public";

export default function NuovoSmarrimentoPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  const [type, setType] = useState<ReportType>("lost");
  const [title, setTitle] = useState("");
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

  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg(null);

    if (!consent) {
      setResultMsg("Devi accettare il consenso per pubblicare l’annuncio.");
      return;
    }

    if (!coords.lat || !coords.lng) {
      setResultMsg("Seleziona un punto sulla mappa (o cerca un indirizzo) prima di pubblicare.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title:
            title.trim() ||
            (type === "lost"
              ? "Smarrimento"
              : type === "found"
                ? "Trovato in custodia"
                : "Avvistamento"),
          animal_name: animalName.trim() || null,
          species: species.trim(),
          region: region.trim(),
          province: province.trim(),
          location_text: locationText.trim(),
          event_date: eventDate,
          description: description.trim() || null,
          photo_urls: [],
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || null,
          contact_mode: contactMode,
          consent,
          lat: coords.lat,
          lng: coords.lng,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResultMsg(data?.error || "Errore pubblicazione.");
        return;
      }

      setResultMsg("✅ Perfetto! Controlla la tua email per confermare l’annuncio.");
    } catch {
      setResultMsg("Errore di rete o server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-zinc-900">Pubblica (rapido)</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Pubblica in 60 secondi e condividi subito su Facebook. Ti inviamo una mail per confermare.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Tipo annuncio
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium"
          >
            <option value="lost">Smarrito</option>
            <option value="found">Trovato (in custodia)</option>
            <option value="sighted">Avvistato</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Titolo (breve)
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Cane smarrito - Leo - Firenze"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Nome animale (opzionale)
          <input
            value={animalName}
            onChange={(e) => setAnimalName(e.target.value)}
            placeholder="Leo"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            Regione
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Toscana"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            Provincia
            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="FI"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Zona / Comune / Quartiere
          <input
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="Es. Coverciano, Firenze"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Data evento
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
          />
        </label>

        {/* MAPPA GOOGLE (vera) */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold text-zinc-900">Posizione (Google Maps)</div>

          <div className="mt-3">
            <MapsWithConsent>
              <LocationPicker
                apiKey={apiKey}
                value={coords}
                onChange={setCoords}
                onAddress={(a) => {
                  if (a.city && !locationText.trim()) setLocationText(a.city);
                  if (a.province && !province.trim()) setProvince(a.province);
                }}
              />
            </MapsWithConsent>
          </div>

          <div className="mt-3 text-xs text-zinc-600">
            Coordinate:{" "}
            <span className="font-semibold">
              {coords.lat != null && coords.lng != null ? `${coords.lat}, ${coords.lng}` : "non selezionate"}
            </span>
          </div>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Descrizione (opzionale)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Segni particolari, collare, zona precisa..."
            className="min-h-[100px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Email (obbligatoria)
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="tu@email.it"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
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

        <button
          disabled={loading}
          className="h-11 rounded-xl bg-black text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Pubblicazione..." : "Pubblica annuncio"}
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