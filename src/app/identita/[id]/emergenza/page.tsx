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
  verified_by: string | null;
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
  photo: boolean;
  name: boolean;
  species: boolean;
  breed: boolean;
  color: boolean;
  size: boolean;
  allergies: boolean;
  therapies: boolean;
  chronicPathologies: boolean;
  bloodType: boolean;
  sterilizationStatus: boolean;
};

const DEFAULT_FIELDS: EmergencyFieldState = {
  photo: true,
  name: true,
  species: true,
  breed: true,
  color: true,
  size: true,
  allergies: true,
  therapies: true,
  chronicPathologies: true,
  bloodType: true,
  sterilizationStatus: true,
};

const FIELD_LABELS: Record<keyof EmergencyFieldState, string> = {
  photo: "Foto",
  name: "Nome",
  species: "Specie",
  breed: "Razza",
  color: "Colore",
  size: "Taglia",
  allergies: "Allergie",
  therapies: "Terapie attive",
  chronicPathologies: "Patologie croniche",
  bloodType: "Gruppo sanguigno",
  sterilizationStatus: "Sterilizzato / castrato",
};

export default function AnimalEmergencyPage() {
  const params = useParams<{ id: string }>();
  const animalId = params?.id ?? "";

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [fields, setFields] = useState<EmergencyFieldState>(DEFAULT_FIELDS);

  const [loadingExistingQr, setLoadingExistingQr] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
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

    void load();

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

  function toggleField(key: keyof EmergencyFieldState) {
    setFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function handleGenerate() {
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
    fields.species ? animal.species : "",
    fields.breed ? animal.breed || "" : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <PageShell
      title="QR emergenza / medaglietta"
      subtitle="QR separato dai codici identificativi UNIMALIA."
      backFallbackHref={`/identita/${animalId}`}
      actions={
        <>
          <ButtonSecondary href={`/identita/${animalId}`}>Torna alla scheda animale</ButtonSecondary>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Dati visibili</h2>
          <p className="mt-1 text-sm text-zinc-600">
            In questa fase la selezione è visiva e serve a preparare la configurazione finale.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.keys(DEFAULT_FIELDS) as Array<keyof EmergencyFieldState>).map((key) => (
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

          {eventsError ? <p className="mt-4 text-xs text-amber-700">{eventsError}</p> : null}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Anteprima scheda emergenza</h2>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              {fields.photo && animal.photo_url ? (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:w-44">
                  <img
                    src={animal.photo_url}
                    alt={animal.name}
                    className="h-44 w-full object-contain"
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1 space-y-3">
                {fields.name ? (
                  <div className="text-lg font-semibold text-zinc-900">{animal.name}</div>
                ) : null}

                {showSpeciesLine ? <div className="text-sm text-zinc-600">{showSpeciesLine}</div> : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  {fields.color ? (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-500">Colore</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {animal.color || "—"}
                      </div>
                    </div>
                  ) : null}

                  {fields.size ? (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-500">Taglia</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {animal.size || "—"}
                      </div>
                    </div>
                  ) : null}

                  {fields.bloodType ? (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-500">Gruppo sanguigno</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {quick.bloodType || "—"}
                      </div>
                    </div>
                  ) : null}

                  {fields.sterilizationStatus ? (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-500">Sterilizzato / castrato</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {quick.sterilizationStatus || "—"}
                      </div>
                    </div>
                  ) : null}
                </div>

                {fields.allergies ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <div className="text-xs font-semibold text-red-700">⚠️ Allergie</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {quick.allergies.length > 0 ? quick.allergies.join(", ") : "—"}
                    </div>
                  </div>
                ) : null}

                {fields.therapies ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="text-xs font-semibold text-zinc-500">💊 Terapie attive</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {quick.activeTherapies.length > 0 ? quick.activeTherapies.join(", ") : "—"}
                    </div>
                  </div>
                ) : null}

                {fields.chronicPathologies ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="text-xs font-semibold text-zinc-500">🩺 Patologie croniche</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">
                      {quick.chronicPathologies.length > 0
                        ? quick.chronicPathologies.join(", ")
                        : "—"}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Questa anteprima serve a preparare la futura configurazione salvata lato server.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              {qrUrl ? "QR emergenza attivo" : "Genera QR emergenza"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Questo QR è distinto da QR e barcode UNIMALIA già presenti nella scheda animale.
            </p>
            <p className="mt-2 text-xs text-amber-700">
              Generando un nuovo QR, quello precedente verrà disattivato.
            </p>
          </div>

          {qrError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {qrError}
            </div>
          ) : null}

          {qrUrl ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[220px,1fr]">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex justify-center rounded-xl bg-white p-3">
                  <QRCode
                    value={qrUrl}
                    size={160}
                    style={{ width: "160px", height: "160px" }}
                    viewBox="0 0 256 256"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-xs text-zinc-500">URL pubblico</div>
                <div className="mt-1 break-all text-sm font-semibold text-zinc-900">{qrUrl}</div>

                <div className="mt-4 flex flex-wrap gap-3">
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

                <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
                  <h3 className="font-semibold text-zinc-900">🏷️ Come stampare la medaglietta</h3>

                  <ul className="mt-3 space-y-1">
                    <li>
                      • Dimensione consigliata: <b>2,5 – 3 cm</b>
                    </li>
                    <li>
                      • Dimensione minima: <b>2 cm</b>
                    </li>
                    <li>
                      • Colore QR: <b>nero su fondo bianco</b>
                    </li>
                    <li>• Mantieni un bordo bianco attorno al QR</li>
                    <li>• Evita superfici lucide o riflettenti</li>
                  </ul>

                  <p className="mt-3 text-xs text-zinc-500">
                    I dati dell’animale sono sempre aggiornati automaticamente. Non è necessario
                    ristampare il QR in caso di modifiche ai dati.
                  </p>

                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Se generi un nuovo QR, quello precedente smetterà di funzionare e l’eventuale
                    medaglietta andrà ristampata.
                  </p>
                </section>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              {loadingExistingQr
                ? "Sto controllando se esiste già un QR attivo…"
                : "Non esiste ancora un QR attivo per questo animale. Generane uno per ottenere il link pubblico separato."}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={handleGenerate}
              disabled={generating || loadingExistingQr}
              className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingExistingQr
                ? "Caricamento QR…"
                : generating
                ? "Generazione in corso…"
                : "Genera QR emergenza"}
            </button>

            <p className="text-xs text-zinc-500">
              Ogni nuova generazione invalida il QR precedente. Se utilizzi una medaglietta,
              dovrai aggiornarla.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Medaglietta con QR emergenza
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  Medaglietta resistente pronta all’uso, già configurata con il QR emergenza.
                </p>
              </div>

              <div className="text-sm font-semibold text-zinc-900">€19,99</div>
            </div>

            <div className="mt-4">
              <a
                href="/medaglietta"
                className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
              >
                Ordina medaglietta
              </a>
            </div>

            <p className="mt-3 text-[11px] text-zinc-500">
              Spedizione inclusa. Servizio in arrivo.
            </p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}