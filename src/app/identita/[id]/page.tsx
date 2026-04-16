"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
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
  birth_date?: string | null;

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

type ClinicEventMeta = Record<string, unknown>;

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
  data?: ClinicEventMeta | null;
  payload?: ClinicEventMeta | null;
  meta?: ClinicEventMeta | null;
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

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.75rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_10px_28px_rgba(42,56,86,0.05)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[#edf2f7] bg-[#fbfdff] px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7d91]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[#30486f]">{value}</div>
    </div>
  );
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
      if (!animal?.id) {
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
          setEventsError("Impossibile caricare la scheda clinica rapida.");
          setEventsLoading(false);
          return;
        }

        const json = await res.json().catch(() => ({}));
        setEvents((json?.events as ClinicEventRow[]) ?? []);
      } catch {
        if (!alive) return;
        setEvents([]);
        setEventsError("Errore di rete durante il caricamento della scheda clinica rapida.");
      } finally {
        if (!alive) return;
        setEventsLoading(false);
      }
    }

    void loadClinicEvents();

    return () => {
      alive = false;
    };
  }, [animal?.id]);

  const rapidClinicalState = useMemo(() => {
    return buildClinicalQuickSummary({
      animal: {
        birth_date: animal?.birth_date ?? null,
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
          <ButtonSecondary href={`/identita/${animal.id}/clinica`}>
            Scheda clinica rapida
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
      <OwnerGrantNotifier animalId={animal.id} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#6f7d91]">
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

        <div className="grid gap-5 lg:grid-cols-[0.94fr_1.06fr]">
          <div className="flex flex-col gap-5">
            <Card>
              <h2 className="text-base font-semibold text-[#30486f]">Foto animale</h2>

              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#e3e9f0] bg-[#f7fafc] p-3">
                <div className="overflow-hidden rounded-[1.1rem] border border-[#dfe6ee] bg-white">
                  <div className="relative h-72 w-full">
                    <Image
                      src={animal.photo_url || "/placeholder-animal.jpg"}
                      alt={animal.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-base font-semibold text-[#30486f]">Identità</h2>

                <Link
                  href={`/identita/${animal.id}/modifica`}
                  className="shrink-0 rounded-xl border border-[#d7dfe9] bg-white px-3 py-2 text-sm font-semibold text-[#30486f] hover:bg-[#f8fbff]"
                >
                  Aggiorna dati
                </Link>
              </div>

              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f7d91]">Nome</dt>
                  <dd className="font-semibold text-[#30486f]">{animal.name}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f7d91]">Tipo</dt>
                  <dd className="font-semibold text-[#30486f]">{animal.species}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f7d91]">Razza</dt>
                  <dd className="font-semibold text-[#30486f]">{animal.breed || "—"}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f7d91]">Colore / segni</dt>
                  <dd className="font-semibold text-[#30486f]">{animal.color || "—"}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f7d91]">Taglia</dt>
                  <dd className="font-semibold text-[#30486f]">{animal.size || "—"}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f7d91]">Sterilizzato / castrato</dt>
                  <dd className="font-semibold text-[#30486f]">
                    {formatSterilizedLabel(animal.sterilized)}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#30486f]">Codici</h2>
                  <p className="mt-1 text-sm text-[#5f708a]">
                    Da usare in emergenza o per verifica rapida.
                  </p>
                </div>

                <div className="shrink-0">{codeStatusBadge}</div>
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-[#edf2f7] bg-[#fbfdff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7d91]">
                  Microchip / Codice
                </div>
                <div className="mt-1 text-sm font-semibold text-[#30486f]">
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

              <p className="mt-3 text-xs text-[#6f7d91]">
                Nota: alcuni animali possono non avere microchip. In quel caso UNIMALIA usa un
                codice interno.
              </p>
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#30486f]">Scheda clinica rapida</h2>
                  <p className="mt-1 text-sm text-[#5f708a]">
                    Sintesi rapida gratuita con i dati essenziali del tuo animale.
                  </p>
                </div>

                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Free
                </span>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-[#e3e9f0] bg-[#f8fbff] p-4">
                <div className="text-sm font-semibold text-[#30486f]">
                  Età: {rapidClinicalState.age} | Peso: {rapidClinicalState.weight}
                </div>
                <div className="mt-2 text-sm leading-7 text-[#5f708a]">
                  Sintesi immediata dei dati clinici essenziali. Le modifiche professionali restano
                  gestite dai veterinari autorizzati.
                </div>

                {eventsLoading ? (
                  <p className="mt-3 text-xs text-[#6f7d91]">Caricamento dati clinici…</p>
                ) : null}

                {eventsError ? (
                  <p className="mt-3 text-xs text-amber-700">{eventsError}</p>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoTile label="Gruppo sanguigno" value={rapidClinicalState.bloodType || "—"} />
                <InfoTile
                  label="Sterilizzato / castrato"
                  value={rapidClinicalState.sterilizationStatus || "—"}
                />
                <InfoTile
                  label="Allergie"
                  value={
                    rapidClinicalState.allergies.length > 0
                      ? rapidClinicalState.allergies.join(", ")
                      : "—"
                  }
                />
                <InfoTile
                  label="Terapie attive"
                  value={
                    rapidClinicalState.activeTherapies.length > 0
                      ? rapidClinicalState.activeTherapies.join(", ")
                      : "—"
                  }
                />
                <InfoTile
                  label="Ultime terapie"
                  value={
                    rapidClinicalState.lastTherapies.length > 0
                      ? rapidClinicalState.lastTherapies.join(", ")
                      : "—"
                  }
                />
                <InfoTile
                  label="Patologie croniche"
                  value={
                    rapidClinicalState.chronicPathologies.length > 0
                      ? rapidClinicalState.chronicPathologies.join(", ")
                      : "—"
                  }
                />
                <InfoTile label="Ricontrolli programmati" value={rapidClinicalState.nextRecall || "—"} />
                <InfoTile label="Ultima visita" value={rapidClinicalState.latestVisit || "—"} />
                <InfoTile
                  label="Ultima vaccinazione"
                  value={rapidClinicalState.latestVaccination || "—"}
                />
                <InfoTile
                  label="Vaccinazioni scadute / in scadenza"
                  value={rapidClinicalState.vaccinationExpiry || "—"}
                />
              </div>

              <div className="mt-4">
                <Link
                  href={`/identita/${animal.id}/clinica`}
                  className="inline-flex items-center justify-center rounded-xl border border-[#d7dfe9] bg-white px-4 py-2 text-sm font-semibold text-[#30486f] hover:bg-[#f8fbff]"
                >
                  Apri scheda clinica rapida
                </Link>
              </div>

              <p className="mt-3 text-xs text-[#6f7d91]">
                Questa sezione è gratuita. La cartella clinica completa e la timeline avanzata
                restano funzioni Premium.
              </p>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#30486f]">Cartella clinica completa</h2>
                  <p className="mt-1 text-sm text-[#5f708a]">
                    Archivio completo, timeline organizzata e consultazione estesa.
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
                  href="/prezzi"
                  className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Sblocca con Premium
                </Link>
              </div>

              <p className="mt-3 text-xs text-[#6f7d91]">
                La cartella clinica completa includerà una vista più estesa e organizzata dello
                storico sanitario dell’animale.
              </p>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#30486f]">Storia animale</h2>
                  <p className="mt-1 text-sm text-[#5f708a]">
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
                      ? "border border-[#d7dfe9] bg-white text-[#30486f] hover:bg-[#f8fbff]"
                      : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  {premiumOk ? "Apri storia animale" : "Sblocca con Premium"}
                </Link>
              </div>

              <p className="mt-3 text-xs text-[#6f7d91]">
                La Storia animale raccoglierà eventi non clinici come servizi, attività e
                promemoria. Le associazioni avranno accesso gratuito quando questa sezione sarà
                attivata anche lato professionisti.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {shareOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-[#e3e9f0] bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-[#30486f]">
                  Condividi al professionista
                </div>
                <div className="mt-1 text-sm text-[#5f708a]">
                  Scegli come condividere questa identità con un veterinario.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="rounded-xl border border-[#d7dfe9] bg-white px-3 py-2 text-sm font-semibold text-[#30486f] hover:bg-[#f8fbff]"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                className="w-full rounded-[1.25rem] border border-[#e3e9f0] bg-[#f8fbff] px-4 py-4 text-left text-sm font-semibold text-[#30486f]"
                onClick={() => {
                  alert("Veterinario di fiducia: non ancora impostato.");
                  setShareOpen(false);
                }}
              >
                Veterinario di fiducia
                <div className="mt-1 text-xs font-normal leading-6 text-[#5f708a]">
                  (In futuro: condivisione 1-click con il tuo vet.)
                </div>
              </button>

              <button
                type="button"
                className="w-full rounded-[1.25rem] border border-[#e3e9f0] bg-white px-4 py-4 text-left text-sm font-semibold text-[#30486f] hover:bg-[#f8fbff]"
                onClick={() => {
                  alert("Altro veterinario: flusso in definizione (nome/codice accesso).");
                  setShareOpen(false);
                }}
              >
                Condividi ad altro veterinario
                <div className="mt-1 text-xs font-normal leading-6 text-[#5f708a]">
                  (In futuro: ricerca per nome o codice di accesso.)
                </div>
              </button>
            </div>

            <div className="mt-4 text-xs text-[#6f7d91]">
              Nota: questo pulsante non apre il portale professionisti.
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}