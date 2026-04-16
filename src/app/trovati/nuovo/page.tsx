"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import LocationPicker from "../../_components/LocationPicker";

type ReportType = "found" | "sighted";
type ContactMode = "protected" | "phone_public";

type LocationAddress = {
  formattedAddress?: string | null;
  province?: string | null;
  region?: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Errore di rete o server.";
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className="block text-sm font-semibold text-[#30486f]">{children}</span>;
}

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
    setResultMsg(null);

    if (!file) {
      setPhotoPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photo) return null;

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("file", photo);

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
      const uploadedPhotoUrl = await uploadPhoto();

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
          photo_urls: uploadedPhotoUrl ? [uploadedPhotoUrl] : [],
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
        type === "found"
          ? "✅ Segnalazione di animale trovato pubblicata correttamente. Ora può essere contattato in modo protetto."
          : "✅ Avvistamento pubblicato correttamente. Anche senza foto, il luogo preciso aiuta molto."
      );

      setType("found");
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
    } catch (error: unknown) {
      setResultMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const isFound = type === "found";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex w-fit items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Trovati e avvistamenti
              </span>

              <Link
                href="/trovati"
                className="text-sm font-semibold text-[#5f708a] underline-offset-4 transition hover:text-[#30486f] hover:underline"
              >
                ← Torna ai trovati
              </Link>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
              Segnala trovato o avvistato
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-8 text-[#55657d] sm:text-base">
              Scegli prima il tipo di segnalazione. Anche qui il contatto può restare protetto, in
              modo da aiutare il ricongiungimento senza esporre subito i tuoi recapiti.
            </p>

            <form onSubmit={onSubmit} className="mt-8 grid gap-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setType("found")}
                  className={`rounded-[22px] border p-5 text-left transition ${
                    isFound
                      ? "border-[#30486f] bg-[#30486f] text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)]"
                      : "border-[#e3e9f0] bg-white text-[#30486f] hover:bg-[#f8fbff]"
                  }`}
                >
                  <div className="text-sm font-semibold">Animale trovato</div>
                  <div className={`mt-2 text-xs leading-6 ${isFound ? "text-white/80" : "text-[#5f708a]"}`}>
                    Hai recuperato l’animale oppure sai esattamente dove si trova.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setType("sighted")}
                  className={`rounded-[22px] border p-5 text-left transition ${
                    !isFound
                      ? "border-[#30486f] bg-[#30486f] text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)]"
                      : "border-[#e3e9f0] bg-white text-[#30486f] hover:bg-[#f8fbff]"
                  }`}
                >
                  <div className="text-sm font-semibold">Animale avvistato</div>
                  <div className={`mt-2 text-xs leading-6 ${!isFound ? "text-white/80" : "text-[#5f708a]"}`}>
                    Lo hai visto, ma non lo hai recuperato.
                  </div>
                </button>
              </div>

              <div className="rounded-[22px] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm leading-7 text-[#55657d]">
                {isFound ? (
                  <>
                    <span className="font-semibold text-[#30486f]">Animale trovato:</span> descrivi
                    dove si trova, se è al sicuro e qualsiasi dettaglio utile. La foto è facoltativa
                    ma molto consigliata.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-[#30486f]">Animale avvistato:</span> segnala
                    comunque anche senza foto. Più sono precisi luogo, orario e direzione, meglio è.
                  </>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel>Nome animale (se noto)</FieldLabel>
                  <input
                    value={animalName}
                    onChange={(e) => setAnimalName(e.target.value)}
                    placeholder="Es. Leo"
                    className="h-12 w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 text-sm text-[#30486f] outline-none transition placeholder:text-[#7a8799] focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
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
                <FieldLabel>Foto (facoltativa)</FieldLabel>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
                  className="block w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 py-3 text-sm text-[#30486f] file:mr-3 file:rounded-xl file:border-0 file:bg-[#eef3f8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#30486f]"
                />
                <span className="text-xs leading-6 text-[#5f708a]">
                  {isFound
                    ? "Molto utile per aiutare il riconoscimento, ma non obbligatoria."
                    : "Facoltativa. Se non hai foto, pubblica comunque l’avvistamento."}
                </span>
              </label>

              {photoPreview ? (
                <div className="overflow-hidden rounded-[24px] border border-[#e3e9f0] bg-[#f8fbff] p-3">
                  <div className="relative h-72 w-full overflow-hidden rounded-[20px] border border-[#dbe5ef] bg-white">
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

              <label className="grid gap-2">
                <FieldLabel>Data evento</FieldLabel>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="h-12 w-full rounded-[18px] border border-[#d7e0ea] bg-[#fcfdff] px-4 text-sm text-[#30486f] outline-none transition focus:border-[#5f708a] focus:bg-white focus:ring-4 focus:ring-[#30486f]/10"
                  required
                />
              </label>

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
                    onAddress={(a: LocationAddress) => {
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

              <label className="grid gap-2">
                <FieldLabel>Descrizione</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isFound
                      ? "Dove si trova, se è in sicurezza, se ha collare, condizioni apparenti..."
                      : "Dove l’hai visto, in che direzione andava, orario, particolari utili..."
                  }
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

              <label className="flex items-start gap-3 rounded-[20px] border border-[#e3e9f0] bg-[#f8fbff] p-4 text-sm leading-7 text-[#55657d]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Accetto informativa privacy e autorizzo la pubblicazione della segnalazione
                  secondo le opzioni selezionate.
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
                {loading
                  ? "Pubblicazione..."
                  : uploadingPhoto
                    ? "Caricamento foto..."
                    : "Pubblica segnalazione"}
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
                Segnalazione utile
              </span>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Anche un avvistamento può fare la differenza
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
                Un luogo preciso, una descrizione chiara e un contatto affidabile possono aiutare
                moltissimo chi sta cercando il proprio animale.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Se l’hai trovato</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Specifica se l’animale è al sicuro, se è stato recuperato e in che condizioni
                    apparenti si trova.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Se l’hai solo visto</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Indica direzione, orario, zona esatta e qualsiasi dettaglio che possa aiutare a
                    seguirne gli spostamenti.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Contatto protetto</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Il sistema può aiutarti a restare raggiungibile senza esporre subito i recapiti
                    pubblicamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <span className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Consigli rapidi
              </span>

              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                Cosa aiuta davvero
              </h3>

              <ul className="mt-5 list-disc space-y-3 pl-6 text-sm leading-7 text-[#55657d] sm:text-base">
                <li>segnalare la posizione più precisa possibile</li>
                <li>indicare se l’animale è fermo, spaventato o in movimento</li>
                <li>aggiungere collare, pettorina o segni distintivi</li>
                <li>pubblicare anche senza foto se l’avvistamento è recente e utile</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h3 className="text-xl font-semibold text-[#30486f]">Ogni segnalazione conta</h3>
              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                Anche quando non riesci a recuperare l’animale, una segnalazione ben fatta può
                aiutare concretamente chi lo sta cercando.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}