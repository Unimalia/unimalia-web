"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useLoadScript,
} from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

function extractCityProvinceFromFormatted(text: string) {
  const provinceMatch = text.match(/\b([A-Z]{2})\b/);
  const province = provinceMatch?.[1] || "";

  const parts = text.split(",").map((p) => p.trim());
  let city = "";

  for (const p of parts) {
    if (province && p.includes(` ${province}`)) {
      city = p
        .replace(/\b\d{5}\b/g, "")
        .replace(new RegExp(`\\b${province}\\b`, "g"), "")
        .replace(/\s+/g, " ")
        .trim();
      break;
    }
  }

  if (!city && parts.length >= 2) {
    city = parts[parts.length - 2]
      .replace(/\b\d{5}\b/g, "")
      .replace(/\b[A-Z]{2}\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return { city, province };
}

function extractCityProvinceFromPlace(place: google.maps.places.PlaceResult) {
  const comps = place.address_components || [];

  const find = (type: string) => comps.find((c) => c.types.includes(type));
  const long = (type: string) => find(type)?.long_name || "";
  const short = (type: string) => find(type)?.short_name || "";

  const city =
    long("locality") ||
    long("postal_town") ||
    long("administrative_area_level_3") ||
    long("sublocality") ||
    long("sublocality_level_1") ||
    "";

  const province =
    short("administrative_area_level_2") ||
    long("administrative_area_level_2") ||
    "";

  return { city, province };
}

export default function SmarrimentoPage() {
  const router = useRouter();

  const [species, setSpecies] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [description, setDescription] = useState("");
  const [lostDate, setLostDate] = useState("");

  // contatti opzionali
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // luogo + coordinate
  const [placeText, setPlaceText] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  // maps autocomplete
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  // foto UX
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const mapCenter = useMemo(() => {
    if (lat != null && lng != null) return { lat, lng };
    return { lat: 43.7696, lng: 11.2558 }; // Firenze
  }, [lat, lng]);

  function onPlaceChanged() {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();

    const formatted = place.formatted_address || place.name || placeText || "";
    if (formatted) setPlaceText(formatted);

    const location = place.geometry?.location;
    if (location) {
      setLat(location.lat());
      setLng(location.lng());
    }

    const fromPlace = extractCityProvinceFromPlace(place);
    const fromText = extractCityProvinceFromFormatted(formatted);

    setCity(fromPlace.city || fromText.city || "");
    setProvince(fromPlace.province || fromText.province || "");
  }

  function pickPhoto() {
    fileInputRef.current?.click();
  }

  function onPhotoSelected(file: File | null) {
    setPhoto(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);

    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userData.user;
      if (!user) {
        router.push("/login");
        return;
      }

      // profilo (se FK)
      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id }, { onConflict: "id" });
      if (profileErr) throw profileErr;

      if (!placeText.trim()) {
        setMsg("Seleziona un luogo con Google Maps (campo Luogo).");
        setLoading(false);
        return;
      }

      if (!photo) {
        setMsg("Aggiungi una foto (aiuta tantissimo il ritrovamento).");
        setLoading(false);
        return;
      }

      // upload foto
      const fileExt = photo.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("lost-animals")
        .upload(filePath, photo, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("lost-animals")
        .getPublicUrl(filePath);

      const photoUrl = publicUrlData.publicUrl;

      const { error: insertError } = await supabase.from("lost_events").insert({
        reporter_id: user.id,
        species: species.trim(),
        animal_name: animalName.trim() || null,
        description: description.trim(),
        lost_date: lostDate,
        status: "active",
        primary_photo_url: photoUrl,
        city: (city || "").trim(),
        province: (province || "").trim(),
        country: "IT",
        lat: lat,
        lng: lng,
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
      });

      if (insertError) throw insertError;

      setMsg("Smarrimento pubblicato correttamente ✅");

      setSpecies("");
      setAnimalName("");
      setDescription("");
      setLostDate("");
      setContactPhone("");
      setContactEmail("");

      setPlaceText("");
      setLat(null);
      setLng(null);
      setCity("");
      setProvince("");

      onPhotoSelected(null);
    } catch (err: any) {
      setMsg(err?.message ?? "Errore durante la pubblicazione");
    } finally {
      setLoading(false);
    }
  }

  if (loadError) {
    return (
      <main>
        <p className="text-red-600">Errore nel caricamento di Google Maps.</p>
        <p className="mt-2 text-sm text-zinc-700">
          Controlla key, referrer localhost, e che Maps JavaScript API + Places API (New) siano abilitate.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">Pubblica smarrimento</h1>

      <p className="mt-3 max-w-2xl text-zinc-700">
        Inserisci i dettagli, scegli il luogo su mappa e aggiungi una foto recente.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid max-w-5xl gap-6 lg:grid-cols-2"
      >
        {/* SINISTRA */}
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {/* Foto UX */}
          <div>
            <label className="block text-sm font-medium">Foto animale</label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPhotoSelected(e.target.files?.[0] || null)}
            />

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={pickPhoto}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                <span aria-hidden>📷</span>
                Scegli foto
              </button>

              <span className="text-xs text-zinc-600">
                {photo ? photo.name : "Nessuna foto selezionata"}
              </span>
            </div>

            {photoPreview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
                <img
                  src={photoPreview}
                  alt="Anteprima foto"
                  className="h-48 w-full object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Specie</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Cane, gatto..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Nome animale (opzionale)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={animalName}
              onChange={(e) => setAnimalName(e.target.value)}
              placeholder="Es. Luna"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Data smarrimento</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              value={lostDate}
              onChange={(e) => setLostDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Descrizione</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dettagli utili: colore, collare, zona, ecc."
              required
            />
          </div>

          {/* Contatti */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-900">Contatti (opzionali)</p>
            <p className="mt-1 text-xs text-zinc-600">
              Se qualcuno lo vede, potrà contattarti più velocemente.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Telefono</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Es. 3331234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Es. nome@email.it"
                />
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-lg bg-black px-6 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Pubblicazione..." : "Pubblica smarrimento"}
          </button>

          {msg && <p className="text-sm text-zinc-700">{msg}</p>}
        </div>

        {/* DESTRA: MAPS */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium">Luogo (cerca e seleziona)</label>

            {!isLoaded ? (
              <p className="mt-2 text-sm text-zinc-600">Caricamento Maps…</p>
            ) : (
              <Autocomplete
                onLoad={(a) => setAutocomplete(a)}
                onPlaceChanged={onPlaceChanged}
              >
                <input
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                  placeholder="Es. Piazza della Signoria, Firenze"
                  value={placeText}
                  onChange={(e) => setPlaceText(e.target.value)}
                />
              </Autocomplete>
            )}

            <div className="mt-3 text-xs text-zinc-600">
              <div>
                <span className="font-medium">Lat:</span>{" "}
                {lat != null ? lat.toFixed(6) : "-"}
              </div>
              <div>
                <span className="font-medium">Lng:</span>{" "}
                {lng != null ? lng.toFixed(6) : "-"}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {!isLoaded ? (
              <div className="p-6 text-sm text-zinc-600">Caricamento mappa…</div>
            ) : (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "420px" }}
                center={mapCenter}
                zoom={lat != null && lng != null ? 15 : 12}
              >
                <Marker
                  position={mapCenter}
                  draggable
                  onDragEnd={(e) => {
                    const newLat = e.latLng?.lat();
                    const newLng = e.latLng?.lng();
                    if (newLat != null && newLng != null) {
                      setLat(newLat);
                      setLng(newLng);
                    }
                  }}
                />
              </GoogleMap>
            )}
          </div>

          <p className="text-xs text-zinc-500">
            Cerca un luogo e poi sposta il pin per essere super preciso.
          </p>
        </div>
      </form>
    </main>
  );
}
