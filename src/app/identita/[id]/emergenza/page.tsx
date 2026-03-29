"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { supabase } from "@/lib/supabaseClient";
import { authHeaders } from "@/lib/client/authHeaders";
import { buildClinicalQuickSummary } from "@/lib/clinic/quickSummary";
import { PageShell } from "@/_components/ui/page-shell";
import { ButtonSecondary } from "@/_components/ui/button";

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  size: string | null;
  photo_url?: string | null;
  birth_date?: string | null;
  sterilized?: boolean | null;
};

type ClinicEventType =
  | "visit"
  | "vaccine"
  | "exam"
  | "therapy"
  | "note"
  | "document"
  | "emergency"
  | "weight"
  | "allergy"
  | "feeding"
  | "surgery"
  | "chronic_condition"
  | "follow_up";

type ClinicEventRow = {
  id: string;
  animal_id: string;
  event_date: string;
  type: ClinicEventType;
  title: string;
  description: string | null;
  visibility: "owner" | "professionals" | "emergency";
  source: "owner" | "professional" | "veterinarian";
  verified_at: string | null;
  verified_by_user_id: string | null;
  due_date?: string | null;
  due_at?: string | null;
  next_due_date?: string | null;
  next_due_at?: string | null;
  expires_at?: string | null;
  weight_kg?: number | null;
  weightKg?: number | null;
  data?: any;
  payload?: any;
  meta?: any;
  status?: string | null;
};

type EmergencyFieldState = {
  show_photo: boolean;
  show_name: boolean;
  show_species: boolean;
  show_breed: boolean;
  show_color: boolean;
  show_size: boolean;
  show_owner_name: boolean;
  show_owner_phone: boolean;
  show_allergies: boolean;
  show_therapies: boolean;
  show_chronic_conditions: boolean;
  show_blood_type: boolean;
  show_sterilization_status: boolean;
  emergency_notes: string;
};

const DEFAULT_FIELDS: EmergencyFieldState = {
  show_photo: true,
  show_name: true,
  show_species: true,
  show_breed: true,
  show_color: true,
  show_size: true,
  show_owner_name: false,
  show_owner_phone: false,
  show_allergies: true,
  show_therapies: true,
  show_chronic_conditions: true,
  show_blood_type: true,
  show_sterilization_status: true,
  emergency_notes: "",
};

const FIELD_LABELS: Record<Exclude<keyof EmergencyFieldState, "emergency_notes">, string> = {
  show_photo: "Foto",
  show_name: "Nome",
  show_species: "Specie",
  show_breed: "Razza",
  show_color: "Colore",
  show_size: "Taglia",
  show_owner_name: "Nome proprietario",
  show_owner_phone: "Telefono proprietario",
  show_allergies: "Allergie",
  show_therapies: "Terapie attive",
  show_chronic_conditions: "Patologie croniche",
  show_blood_type: "Gruppo sanguigno",
  show_sterilization_status: "Sterilizzato / castrato",
};

export default function AnimalEmergencyPage() {
  const params = useParams<{ id: string }>();
  const animalId = params?.id ?? "";

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [fields, setFields] = useState<EmergencyFieldState>(DEFAULT_FIELDS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const [loadingExistingQr, setLoadingExistingQr] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadAnimalAndEvents() {
      if (!animalId) return;

      setLoading(true);
      setEventsError(null);

      const { data: animalData } = await supabase
        .from("animals")
        .select("id, name, species, breed, color, size, photo_url, birth_date, sterilized")
        .eq("id", animalId)
        .single();

      try {
        const res = await fetch(`/api/clinic-events/list?animalId=${encodeURIComponent(animalId)}`, {
          cache: "no-store",
          headers: {
            ...(await authHeaders()),
          },
        });

        const json = await res.json().catch(() => ({}));

        if (!alive) return;

        setAnimal((animalData as Animal) ?? null);

        if (!res.ok) {
          setEvents([]);
          setEventsError("Impossibile caricare la cartella clinica rapida.");
        } else {
          setEvents((json?.events as ClinicEventRow[]) ?? []);
        }
      } catch {
        if (!alive) return;
        setAnimal((animalData as Animal) ?? null);
        setEvents([]);
        setEventsError("Errore di rete durante il caricamento dati.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void loadAnimalAndEvents();

    return () => {
      alive = false;
    };
  }, [animalId]);

  useEffect(() => {
    let alive = true;

    async function loadSettings() {
      if (!animalId) return;

      try {
        const res = await fetch(`/api/animals/${encodeURIComponent(animalId)}/emergency-settings`, {
          cache: "no-store",
          headers: {
            ...(await authHeaders()),
          },
        });

        const json = await res.json().catch(() => ({}));
        if (!alive || !res.ok || !json?.settings) return;

        setFields({
          show_photo: Boolean(json.settings.show_photo),
          show_name: Boolean(json.settings.show_name),
          show_species: Boolean(json.settings.show_species),
          show_breed: Boolean(json.settings.show_breed),
          show_color: Boolean(json.settings.show_color),
          show_size: Boolean(json.settings.show_size),
          show_owner_name: Boolean(json.settings.show_owner_name),
          show_owner_phone: Boolean(json.settings.show_owner_phone),
          show_allergies: Boolean(json.settings.show_allergies),
          show_therapies: Boolean(json.settings.show_therapies),
          show_chronic_conditions: Boolean(json.settings.show_chronic_conditions),
          show_blood_type: Boolean(json.settings.show_blood_type),
          show_sterilization_status: Boolean(json.settings.show_sterilization_status),
          emergency_notes: String(json.settings.emergency_notes ?? ""),
        });
      } catch {}
    }

    void loadSettings();

    return () => {
      alive = false;
    };
  }, [animalId]);

  useEffect(() => {
    let alive = true;

    async function loadExistingQr() {
      if (!animalId) return;

      setLoadingExistingQr(true);
      setQrError(null);

      try {
        const res = await fetch(`/api/animals/${encodeURIComponent(animalId)}/emergency-token`, {
          method: "GET",
          cache: "no-store",
          headers: {
            ...(await authHeaders()),
          },
        });

        const json = await res.json().catch(() => ({}));

        if (!alive) return;

        if (!res.ok) {
          setQrUrl("");
          setQrError(json?.error || "Impossibile leggere il QR emergenza attivo.");
          return;
        }

        setQrUrl(String(json?.url ?? ""));
      } catch {
        if (!alive) return;
        setQrUrl("");
        setQrError("Errore di rete durante il recupero del QR attivo.");
      } finally {
        if (!alive) return;
        setLoadingExistingQr(false);
      }
    }

    void loadExistingQr();

    return () => {
      alive = false;
    };
  }, [animalId]);

  const quick = useMemo(() => {
    return buildClinicalQuickSummary({
      animal: {
        birth_date: animal?.birth_date ?? null,
        sterilized: animal?.sterilized ?? null,
      },
      events,
    });
  }, [animal, events]);

  function toggleField(key: Exclude<keyof EmergencyFieldState, "emergency_notes">) {
    setFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function handleSaveSettings() {
    if (!animalId) return;

    setSavingSettings(true);
    setSettingsMessage(null);

    try {
      const res = await fetch(`/api/animals/${encodeURIComponent(animalId)}/emergency-settings`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(fields),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSettingsMessage(json?.error || "Impossibile salvare le impostazioni.");
        return;
      }

      setSettingsMessage("Impostazioni salvate.");
    } catch {
      setSettingsMessage("Errore di rete durante il salvataggio.");
    } finally {
      setSavingSettings(false);
      setTimeout(() => setSettingsMessage(null), 2500);
    }
  }

  async function handleGenerateQr() {
    const confirmed = window.confirm(
      "Generando un nuovo QR emergenza, il precedente verrà disattivato.\n\nSe hai già stampato una medaglietta, dovrai sostituirla.\n\nI dati dell’animale invece restano sempre aggiornati automaticamente.\n\nVuoi continuare?"
    );

    if (!confirmed || !animalId) return;

    setGenerating(true);
    setQrError(null);

    try {
      const res = await fetch(`/api/animals/${encodeURIComponent(animalId)}/emergency-token`, {
        method: "POST",
        cache: "no-store",
        headers: {
          ...(await authHeaders()),
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setQrUrl("");
        setQrError(json?.error || "Impossibile generare il QR emergenza.");
        return;
      }

      setQrUrl(String(json?.url ?? ""));
    } catch {
      setQrUrl("");
      setQrError("Errore di rete durante la generazione del QR.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <PageShell
        title="QR emergenza / medaglietta"
        subtitle="Caricamento…"
        backFallbackHref={animalId ? `/identita/${animalId}` : "/identita"}
      >
        <div className="text-sm text-zinc-600">Sto caricando i dati emergenza…</div>
      </PageShell>
    );
  }

  if (!animal) {
    return (
      <PageShell title="QR emergenza / medaglietta" backFallbackHref="/identita">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          Animale non trovato.
        </div>
      </PageShell>
    );
  }

  const showSpeciesLine = [
    fields.show_species ? animal.species : "",
    fields.show_breed ? animal.breed || "" : "",
  ]
    .filter(Boolean)
    .join(" • ");

  const hasQr = !!qrUrl;

  return (
    <PageShell
      title="QR emergenza / medaglietta"
      subtitle="QR separato dai codici identificativi UNIMALIA."
      backFallbackHref={`/identita/${animalId}`}
      actions={
        <>
          <ButtonSecondary href={`/identita/${animalId}`}>Torna alla scheda animale</ButtonSecondary>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
          >
            {savingSettings ? "Salvataggio…" : "Salva impostazioni"}
          </button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Dati visibili</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Scegli cosa sarà visibile nella scheda pubblica del QR emergenza.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).map((key) => (
              <label
                key={key}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={fields[key]}
                  onChange={() => toggleField(key)}
                  className="h-4 w-4"
                />
                <span className="font-medium text-zinc-900">{FIELD_LABELS[key]}</span>
              </label>
            ))}
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-zinc-900">Note emergenza</label>
            <textarea
              value={fields.emergency_notes}
              onChange={(e) =>
                setFields((prev) => ({
                  ...prev,
                  emergency_notes: e.target.value,
                }))
              }
              rows={4}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-0"
              placeholder="Informazioni utili in caso di emergenza"
            />
          </div>

          {settingsMessage ? (
            <p className="mt-4 text-xs text-emerald-700">{settingsMessage}</p>
          ) : null}

          {eventsError ? (
            <p className="mt-4 text-xs text-amber-700">{eventsError}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Anteprima scheda emergenza</h2>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              {fields.show_photo && animal.photo_url ? (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:w-44">
                  <img
                    src={animal.photo_url}
                    alt={animal.name}
                    className="h-44 w-full object-contain"
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1 space-y-3">
                {fields.show_name ? (
                  <div className="text-lg font-semibold text-zinc-900">{animal.name}</div>
                ) : null}

                {showSpeciesLine ? (
                  <div className="text-sm text-zinc-600">{showSpeciesLine}</div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  {fields.show_color ? (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-500">Colore</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {animal.color || "—"}
                      </div>
                    </div>
                  ) : null}

                  {fields.show_size ? (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-500">Taglia</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {animal.size || "—"}
                      </div>
                    </div>
                  ) : null}

                  {fields.show_blood_type ? (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-500">Gruppo sanguigno</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {quick.bloodType || "—"}
                      </div>
                    </div>
                  ) : null}

                  {fields.show_sterilization_status ? (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-500">Sterilizzato / castrato</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {quick.sterilizationStatus || "—"}
                      </div>
                    </div>
                  ) : null}
                </div>

                {fields.show_allergies ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <div className="text-xs font-semibold text-red-700">⚠️ Allergie</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {quick.allergies.length > 0 ? quick.allergies.join(", ") : "—"}
                    </div>
                  </div>
                ) : null}

                {fields.show_therapies ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="text-xs font-semibold text-zinc-500">💊 Terapie attive</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {quick.activeTherapies.length > 0 ? quick.activeTherapies.join(", ") : "—"}
                    </div>
                  </div>
                ) : null}

                {fields.show_chronic_conditions ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="text-xs font-semibold text-zinc-500">🩺 Patologie croniche</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {quick.chronicPathologies.length > 0
                        ? quick.chronicPathologies.join(", ")
                        : "—"}
                    </div>
                  </div>
                ) : null}

                {fields.emergency_notes.trim() ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="text-xs font-semibold text-zinc-500">📝 Note emergenza</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {fields.emergency_notes.trim()}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="grid gap-6 lg:grid-cols-[1fr,220px]">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  {hasQr ? "QR emergenza attivo" : "QR emergenza"}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Questo QR è distinto da QR e barcode UNIMALIA già presenti nella scheda animale.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-zinc-900">Ordina medaglietta</h3>
                    <p className="mt-1 text-xs text-zinc-600">
                      Medaglietta resistente pronta all’uso, già configurata con il QR emergenza.
                    </p>
                  </div>

                  <div className="text-sm font-semibold text-zinc-900">€19,99</div>
                </div>

                <ul className="mt-4 space-y-1 text-sm">
                  <li>• Dimensione consigliata: <b>2,5 – 3 cm</b></li>
                  <li>• Dimensione minima: <b>2 cm</b></li>
                  <li>• Colore QR: <b>nero su fondo bianco</b></li>
                  <li>• Mantieni un bordo bianco attorno al QR</li>
                  <li>• Evita superfici lucide o riflettenti</li>
                </ul>

                <p className="mt-3 text-xs text-zinc-500">
                  I dati dell’animale si aggiornano automaticamente. Non serve ristampare il QR
                  se cambiano allergie, terapie o altri dati.
                </p>

                <p className="mt-2 text-xs font-medium text-amber-700">
                  Se crei un nuovo QR code, quello precedente smetterà di funzionare e l’eventuale
                  medaglietta andrà ristampata.
                </p>

                <div className="mt-4">
                  <a
                    href="/medaglietta"
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                  >
                    Ordina medaglietta
                  </a>
                </div>

                <p className="mt-3 text-[11px] text-zinc-500">
                  Spedizione inclusa. Servizio in arrivo.
                </p>
              </div>

              {qrError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {qrError}
                </div>
              ) : null}

              {!hasQr && !loadingExistingQr ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                  Non esiste ancora un QR attivo per questo animale.
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex justify-center rounded-xl bg-white p-3">
                  {hasQr ? (
                    <QRCode
                      value={qrUrl}
                      size={128}
                      style={{ width: "128px", height: "128px" }}
                      viewBox="0 0 256 256"
                    />
                  ) : (
                    <div className="flex h-[128px] w-[128px] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-center text-xs text-zinc-500">
                      QR non ancora generato
                    </div>
                  )}
                </div>
              </div>

              {hasQr ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-xs text-zinc-500">URL pubblico</div>
                  <div className="mt-1 break-all text-sm font-semibold text-zinc-900">
                    {qrUrl}
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Apri scheda pubblica
                    </a>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Stampa
                    </button>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleGenerateQr}
                disabled={generating || loadingExistingQr}
                className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingExistingQr
                  ? "Caricamento QR…"
                  : generating
                  ? "Creazione in corso…"
                  : hasQr
                  ? "Crea nuovo QR code"
                  : "Crea QR emergenza"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}