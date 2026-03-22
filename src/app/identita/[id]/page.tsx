"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getBarcodeValue, getQrValue } from "@/lib/animalCodes";
import { authHeaders } from "@/lib/client/authHeaders";
import { buildClinicalQuickSummary } from "@/lib/clinic/quickSummary";

import { PageShell } from "@/_components/ui/page-shell";
import { ButtonPrimary, ButtonSecondary } from "@/_components/ui/button";
import { AnimalCodes } from "@/_components/animal/animal-codes";
import OwnerGrantNotifier from "@/_components/OwnerGrantNotifier";

type Animal = {
  id: string;
  owner_id: string;
  created_at: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  size: string | null;
  chip_number: string | null;
  microchip_verified: boolean;
  status: string;
  premium_active?: boolean;
  premium_expires_at?: string | null;
  photo_url?: string | null;
  unimalia_code?: string | null;
  sterilized?: boolean | null;

  age_text?: string | null;
  weight?: string | number | null;
  weight_kg?: string | number | null;
  allergies?: string | null;
  active_therapies?: string | null;
  latest_therapies?: string | null;
  chronic_conditions?: string | null;
  planned_rechecks?: string | null;
  last_visit_at?: string | null;
  last_vaccination_at?: string | null;
  vaccine_expiry_alerts?: string | null;
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
  | "follow_up"
  | "blood_type";

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

function statusLabel(status: string) {
  switch (status) {
    case "lost":
      return "🔴 Smarrito";
    case "found":
      return "🔵 Ritrovato";
    case "home":
    case "safe":
    default:
      return "🟢 A casa";
  }
}

function normalizeChip(raw: string | null) {
  return (raw || "").replace(/\s+/g, "").trim();
}

function formatSterilizedLabel(value?: boolean | null) {
  if (value === true) return "Sì";
  if (value === false) return "No";
  return "—";
}

export default function AnimalProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;

      setLoading(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/login?next=/identita/" + id);
        return;
      }

      const { data, error } = await supabase.from("animals").select("*").eq("id", id).single();

      if (!alive) return;

      if (error || !data) {
        setError("Profilo non trovato.");
        setAnimal(null);
        setLoading(false);
        return;
      }

      if (data.owner_id !== user.id) {
        router.replace("/identita");
        return;
      }

      setAnimal(data as Animal);
      setLoading(false);
    }

    void load();
    return () => {
      alive = false;
    };
  }, [id, router]);

  const premiumOk = useMemo(() => {
    if (!animal) return false;
    if (!animal.premium_active) return false;
    if (!animal.premium_expires_at) return true;
    return new Date(animal.premium_expires_at).getTime() > new Date().getTime();
  }, [animal]);

  useEffect(() => {
    let alive = true;

    async function loadClinicEvents() {
      if (!animal?.id || !premiumOk) {
        setEvents([]);
        setEventsError(null);
        return;
      }

      setEventsLoading(true);
      setEventsError(null);

      try {
        const res = await fetch(`/api/clinic-events/list?animalId=${encodeURIComponent(animal.id)}`, {
          cache: "no-store",
          headers: {
            ...(await authHeaders()),
          },
        });

        if (!alive) return;

        if (!res.ok) {
          setEvents([]);
          setEventsError("Impossibile caricare la cartella clinica.");
          setEventsLoading(false);
          return;
        }

        const json = await res.json().catch(() => ({}));
        setEvents((json?.events as ClinicEventRow[]) ?? []);
      } catch {
        if (!alive) return;
        setEvents([]);
        setEventsError("Errore di rete durante il caricamento della cartella clinica.");
      } finally {
        if (!alive) return;
        setEventsLoading(false);
      }
    }

    void loadClinicEvents();

    return () => {
      alive = false;
    };
  }, [animal?.id, premiumOk]);

  const rapidClinicalState = useMemo(() => {
    return buildClinicalQuickSummary({
      animal: {
        birth_date: (animal as any)?.birth_date ?? null,
        sterilized: animal?.sterilized ?? null,
      },
      events: events ?? [],
    });
  }, [animal, events]);

  const qrValue = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://unimalia.it";
    if (!animal) return "";
    return getQrValue(animal, origin);
  }, [animal]);

  const barcodeValue = useMemo(() => {
    if (!animal) return "";
    return getBarcodeValue(animal);
  }, [animal]);

  const codeStatusBadge = useMemo(() => {
    const hasChip = !!animal?.chip_number;
    const verified = !!animal?.microchip_verified;

    const label = hasChip ? "Microchip" : "Codice";
    if (!verified) {
      return (
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          {label} da verificare ⏳
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
        {label} verificato ✅
      </span>
    );
  }, [animal?.chip_number, animal?.microchip_verified]);

  if (loading) {
    return (
      <PageShell
        title="Profilo animale"
        subtitle="Caricamento…"
        backFallbackHref="/identita"
        actions={<div className="h-9 w-32 rounded-lg bg-zinc-200/60" />}
      >
        <div className="text-sm text-zinc-600">Sto caricando la scheda…</div>
      </PageShell>
    );
  }

  if (error || !animal) {
    return (
      <PageShell title="Profilo animale" backFallbackHref="/identita">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error || "Profilo non trovato."}
        </div>
      </PageShell>
    );
  }

  const isLost = animal.status === "lost";

  return (
    <PageShell
      title={animal.name}
      subtitle={`${animal.species}${animal.breed ? ` • ${animal.breed}` : ""} • ${statusLabel(
        animal.status
      )}`}
      backFallbackHref="/identita"
      actions={
        <>
          <ButtonSecondary href={`/identita/${animal.id}/modifica`}>Modifica</ButtonSecondary>
          <ButtonSecondary href={`/identita/${animal.id}/stampa`}>Stampa</ButtonSecondary>

          <ButtonSecondary href={premiumOk ? `/identita/${animal.id}/clinica` : "/prezzi"}>
            Cartella clinica
          </ButtonSecondary>

          <ButtonSecondary href={premiumOk ? `/identita/${animal.id}/storia` : "/prezzi"}>
            Storia animale
          </ButtonSecondary>

          <ButtonSecondary
            href={`/smarrimenti/nuovo?animalId=${encodeURIComponent(animal.id)}`}
          >
            {isLost ? "Aggiorna annuncio smarrimento" : "Segnala come smarrito"}
          </ButtonSecondary>

          <ButtonSecondary href={`/identita/${animal.id}/emergenza`}>
            QR emergenza / medaglietta
          </ButtonSecondary>

          <ButtonSecondary
            href="#"
            onClick={() => {
              setShareOpen(true);
            }}
          >
            Condividi al professionista
          </ButtonSecondary>

          <Link
            href={`/profilo/richieste-accesso?animalId=${encodeURIComponent(id)}`}
            className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            Gestisci accessi professionisti
          </Link>

          <ButtonPrimary href="/identita">Tutte le identità</ButtonPrimary>
        </>
      }
    >
      <OwnerGrantNotifier pathname={`/identita/${animal.id}`} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            Creato il {new Date(animal.created_at).toLocaleDateString("it-IT")}
          </p>

          <div className="flex flex-wrap gap-2">
            {isLost ? (
              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                Questo animale risulta attualmente segnalato come smarrito
              </span>
            ) : null}

            {premiumOk ? (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Premium attivo
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-4 md:col-span-1">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900">Foto animale</h2>

              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 p-3">
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <img
                    src={animal.photo_url || "/placeholder-animal.jpg"}
                    alt={animal.name}
                    className="h-72 w-full object-contain"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-base font-semibold text-zinc-900">Identità</h2>

                <Link
                  href={`/identita/${animal.id}/modifica`}
                  className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Aggiorna dati
                </Link>
              </div>

              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Nome</dt>
                  <dd className="font-medium text-zinc-900">{animal.name}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Tipo</dt>
                  <dd className="font-medium text-zinc-900">{animal.species}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Razza</dt>
                  <dd className="font-medium text-zinc-900">{animal.breed || "—"}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Colore / segni</dt>
                  <dd className="font-medium text-zinc-900">{animal.color || "—"}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Taglia</dt>
                  <dd className="font-medium text-zinc-900">{animal.size || "—"}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Sterilizzato / castrato</dt>
                  <dd className="font-medium text-zinc-900">
                    {formatSterilizedLabel(animal.sterilized)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Cartella clinica rapida</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Sintesi rapida della cartella clinica per valutazione immediata.
                  </p>
                </div>

                {!premiumOk ? (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    Premium
                  </span>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-900">
                  Età: {rapidClinicalState.age} | Peso: {rapidClinicalState.weight}
                </div>
                <div className="mt-2 text-sm text-zinc-600">
                  Cartella clinica: accesso riservato ai veterinari autorizzati per la modifica.
                </div>

                {premiumOk && eventsLoading ? (
                  <p className="mt-3 text-xs text-zinc-500">Caricamento dati clinici…</p>
                ) : null}

                {premiumOk && eventsError ? (
                  <p className="mt-3 text-xs text-amber-700">{eventsError}</p>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs text-zinc-500">Gruppo sanguigno</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {rapidClinicalState.bloodType || "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs text-zinc-500">Sterilizzato / castrato</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {rapidClinicalState.sterilizationStatus || "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs text-zinc-500">Allergie</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {rapidClinicalState.allergies.length > 0
                      ? rapidClinicalState.allergies.join(", ")
                      : "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs text-zinc-500">Terapie attive</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {rapidClinicalState.activeTherapies.length > 0
                      ? rapidClinicalState.activeTherapies.join(", ")
                      : "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs text-zinc-500">Ultime terapie</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {rapidClinicalState.lastTherapies.length > 0
                      ? rapidClinicalState.lastTherapies.join(", ")
                      : "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs text-zinc-500">Patologie croniche</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {rapidClinicalState.chronicPathologies.length > 0
                      ? rapidClinicalState.chronicPathologies.join(", ")
                      : "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs text-zinc-500">Ricontrolli programmati</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {rapidClinicalState.nextRecall || "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs text-zinc-500">Ultima visita</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {rapidClinicalState.latestVisit || "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs text-zinc-500">Ultima vaccinazione</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {rapidClinicalState.latestVaccination || "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs text-zinc-500">Vaccinazioni scadute / in scadenza</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {rapidClinicalState.vaccinationExpiry || "—"}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Cartella clinica</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Consultazione completa della cartella clinica dell’animale.
                  </p>
                </div>

                {!premiumOk ? (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    Premium
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <Link
                  href={premiumOk ? `/identita/${animal.id}/clinica` : "/prezzi"}
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ${
                    premiumOk
                      ? "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                      : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  {premiumOk ? "Apri cartella clinica" : "Sblocca con Premium"}
                </Link>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                La cartella clinica completa è consultabile con Premium. Le modifiche da parte del
                proprietario saranno possibili solo quando il professionista autorizzato sblocca la
                compilazione dello storico.
              </p>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Storia animale</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Timeline non clinica: servizi, promemoria e attività dell’animale.
                  </p>
                </div>

                {!premiumOk ? (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    Premium
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <Link
                  href={premiumOk ? `/identita/${animal.id}/storia` : "/prezzi"}
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ${
                    premiumOk
                      ? "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                      : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  {premiumOk ? "Apri storia animale" : "Sblocca con Premium"}
                </Link>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                La Storia animale raccoglierà eventi non clinici come servizi, attività e
                promemoria. Le associazioni avranno accesso gratuito quando questa sezione sarà
                attivata anche lato professionisti.
              </p>
            </section>
          </div>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Codici</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Da usare in emergenza o per verifica rapida.
                </p>
              </div>

              <div className="shrink-0">{codeStatusBadge}</div>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Microchip / Codice</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                {animal.chip_number ? normalizeChip(animal.chip_number) : barcodeValue}
              </div>
            </div>

            <div className="mt-4">
              <AnimalCodes
                qrValue={qrValue}
                barcodeValue={barcodeValue}
                caption=""
                layout="stack"
              />
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              Nota: alcuni animali possono non avere microchip. In quel caso UNIMALIA usa un codice
              interno.
            </p>
          </section>
        </div>
      </div>

      {shareOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-zinc-900">
                  Condividi al professionista
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  Scegli come condividere questa identità con un veterinario.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm font-semibold text-zinc-900"
                onClick={() => {
                  alert("Veterinario di fiducia: non ancora impostato.");
                  setShareOpen(false);
                }}
              >
                Veterinario di fiducia
                <div className="mt-1 text-xs font-normal text-zinc-600">
                  (In futuro: condivisione 1-click con il tuo vet.)
                </div>
              </button>

              <button
                type="button"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                onClick={() => {
                  alert("Altro veterinario: flusso in definizione (nome/codice accesso).");
                  setShareOpen(false);
                }}
              >
                Condividi ad altro veterinario
                <div className="mt-1 text-xs font-normal text-zinc-600">
                  (In futuro: ricerca per nome o codice di accesso.)
                </div>
              </button>
            </div>

            <div className="mt-4 text-xs text-zinc-500">
              Nota: questo pulsante non apre il portale professionisti.
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}