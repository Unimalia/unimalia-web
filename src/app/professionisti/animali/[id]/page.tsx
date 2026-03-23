"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isVetUser } from "@/app/professionisti/_components/ProShell";
import { AnimalCodes } from "@/_components/animal/animal-codes";
import { authHeaders } from "@/lib/client/authHeaders";
import { getBarcodeValue, getQrValue } from "@/lib/animalCodes";
import { buildClinicalQuickSummary } from "@/lib/clinic/quickSummary";

type Animal = {
  id: string;
  owner_id: string | null;
  created_at: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  size: string | null;
  sex?: string | null;
  sterilized?: boolean | null;
  chip_number: string | null;
  microchip_verified: boolean;
  status: string;
  unimalia_code?: string | null;
  photo_url?: string | null;

  microchip_verified_at?: string | null;
  microchip_verified_org_id?: string | null;
  microchip_verified_by_label?: string | null;

  birth_date?: string | null;
  birth_date_is_estimated?: boolean | null;

  owner_claim_status?: "none" | "pending" | "claimed" | null;
  created_by_role?: string | null;
  created_by_org_id?: string | null;
  origin_org_id?: string | null;

  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
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

  verified_by_label?: string | null;
  verified_by_org_id?: string | null;
  verified_by_member_id?: string | null;

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

function formatDateIT(iso: string) {
  try {
    const s = String(iso || "").trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-").map((x) => Number(x));
      const dt = new Date(y, (m || 1) - 1, d || 1);
      return dt.toLocaleDateString("it-IT", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }

    return new Date(s).toLocaleString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function normalizeChip(raw: string | null) {
  return (raw || "").replace(/\s+/g, "").trim();
}

function normalizePhone(raw?: string | null) {
  return String(raw || "").trim();
}

function formatAgeFromBirthDate(birthDateISO?: string | null) {
  if (!birthDateISO) return "—";

  const safe = /^\d{4}-\d{2}-\d{2}$/.test(birthDateISO)
    ? new Date(`${birthDateISO}T12:00:00`)
    : new Date(birthDateISO);

  if (Number.isNaN(safe.getTime())) return "—";

  const now = new Date();

  let years = now.getFullYear() - safe.getFullYear();
  let months = now.getMonth() - safe.getMonth();
  const days = now.getDate() - safe.getDate();

  if (days < 0) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return "—";

  if (years === 0) return `${months} mesi`;
  if (months === 0) return `${years} anni`;
  return `${years} anni ${months} mesi`;
}

function ownerConnectionLabel(animal: Animal) {
  if (animal.owner_id) return "Proprietario collegato";
  if (animal.owner_claim_status === "pending") return "Proprietario non collegato";
  return "Proprietario non collegato";
}

function displayList(items: string[] | undefined, fallback = "—") {
  if (!items || items.length === 0) return fallback;
  return items;
}

export default function ProAnimalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [isVet, setIsVet] = useState(false);

  const [eventsLoading, setEventsLoading] = useState(false);
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [eventsErr, setEventsErr] = useState<string | null>(null);

  const qrValue = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://unimalia.it";
    if (!animal) return "";
    return getQrValue(animal, origin);
  }, [animal]);

  const barcodeValue = useMemo(() => {
    if (!animal) return "";
    return getBarcodeValue(animal);
  }, [animal]);

  async function loadAnimal() {
    if (!id) return;

    setLoading(true);
    setErr(null);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      router.replace(
        "/professionisti/login?next=" + encodeURIComponent(`/professionisti/animali/${id}`)
      );
      return;
    }

    setIsVet(isVetUser(user));

    const res = await fetch(`/api/professionisti/animal?animalId=${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: {
        ...(await authHeaders()),
        "x-unimalia-app": "professionisti",
      },
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(json?.error || "Animale non trovato.");
      setAnimal(null);
      setLoading(false);
      return;
    }

    const data = json?.animal ?? null;

    if (!data) {
      setErr("Animale non trovato.");
      setAnimal(null);
      setLoading(false);
      return;
    }

    setAnimal(data as Animal);
    setLoading(false);
  }

  async function loadClinicEvents() {
    if (!id) return;

    setEventsLoading(true);
    setEventsErr(null);

    try {
      const res = await fetch(`/api/clinic-events/list?animalId=${encodeURIComponent(id)}`, {
        cache: "no-store",
        headers: {
          ...(await authHeaders()),
          "x-unimalia-app": "professionisti",
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setEvents([]);
          setEventsErr("Cartella clinica: accesso riservato ai veterinari autorizzati.");
          setEventsLoading(false);
          return;
        }
        setEvents([]);
        setEventsErr("Impossibile caricare la cartella clinica (errore server).");
        setEventsLoading(false);
        return;
      }

      const json = await res.json().catch(() => ({}));
      setEvents((json?.events as ClinicEventRow[]) ?? []);
    } catch {
      setEvents([]);
      setEventsErr("Errore di rete durante il caricamento eventi.");
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    void loadAnimal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!animal?.id) return;
    void loadClinicEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal?.id]);

  const microchipVerifierLabel = useMemo(() => {
    if (!animal?.microchip_verified) return null;

    const who = (animal.microchip_verified_by_label || "").trim() || "Veterinario";
    const when = animal.microchip_verified_at ? formatDateIT(animal.microchip_verified_at) : null;

    return when ? `${who} • ${when}` : who;
  }, [
    animal?.microchip_verified,
    animal?.microchip_verified_by_label,
    animal?.microchip_verified_at,
  ]);

  const rapidClinicalState = useMemo(() => {
    return buildClinicalQuickSummary({
      animal: {
        birth_date: animal?.birth_date ?? null,
        sterilized: animal?.sterilized ?? null,
      },
      events: events ?? [],
    });
  }, [animal, events]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-zinc-600">Caricamento scheda…</div>
      </div>
    );
  }

  if (err || !animal) {
    return (
      <div className="space-y-4">
        <div className="text-sm">
          <Link
            href="/professionisti/animali"
            className="font-semibold text-zinc-700 hover:text-zinc-900"
          >
            ← Scanner
          </Link>
        </div>

        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">Animale (Professionisti)</div>
          <div className="mt-2 text-sm text-red-700">{err || "Non disponibile"}</div>
        </div>
      </div>
    );
  }

  const allergiesDisplay = displayList(rapidClinicalState.allergies);
  const activeTherapiesDisplay = displayList(rapidClinicalState.activeTherapies);
  const lastTherapiesDisplay = displayList(rapidClinicalState.lastTherapies);
  const chronicPathologiesDisplay = displayList(rapidClinicalState.chronicPathologies);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-zinc-900">{animal.name}</h1>

            <p className="mt-1 text-sm text-zinc-600">
              {animal.species}
              {animal.breed ? ` • ${animal.breed}` : ""} • {statusLabel(animal.status)}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              ID: <span className="font-mono">{animal.id}</span> • Creato il{" "}
              {new Date(animal.created_at).toLocaleDateString("it-IT")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/professionisti/animali"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Torna allo scanner
            </Link>

            {isVet ? (
              <Link
                href={`/professionisti/animali/${animal.id}/clinica`}
                className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
              >
                Cartella clinica
              </Link>
            ) : (
              <span className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600">
                Cartella clinica (solo vet)
              </span>
            )}

            <span className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600">
              Storia animale
              <span className="ml-2 text-xs font-medium text-zinc-400">(in arrivo)</span>
            </span>

            <Link
              href="/professionisti/richieste"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Vai alle richieste
            </Link>

            <Link
              href={`/professionisti/richieste-accesso?animalId=${encodeURIComponent(id)}`}
              className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              Richiedi accesso (se non autorizzato)
            </Link>

            {!animal.owner_id ? (
              <>
                <Link
                  href={`/professionisti/animali/${animal.id}/collega-proprietario`}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Collega proprietario
                </Link>

                <Link
                  href={`/identita/nuovo?animalId=${encodeURIComponent(animal.id)}`}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Crea identità dalla cartella
                </Link>
              </>
            ) : null}

            {isVet ? (
              animal.microchip_verified ? (
                <span className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Microchip verificato ✅
                </span>
              ) : (
                <Link
                  href={`/professionisti/animali/${animal.id}/verifica`}
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
                >
                  Verifica microchip
                </Link>
              )
            ) : (
              <span className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600">
                Solo vet può verificare
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                animal.owner_id
                  ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
              }
            >
              {ownerConnectionLabel(animal)}
            </span>

            {(animal.created_by_org_id || animal.created_by_role === "professional") && (
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                Creato dalla clinica
              </span>
            )}

            {animal.unimalia_code ? (
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-mono text-zinc-700">
                UNIMALIA: {animal.unimalia_code}
              </span>
            ) : null}
          </div>

          <div className="mt-3">
            <div className="font-semibold">Privacy</div>
            <div className="mt-1 text-sm text-zinc-600">
              Le identità NON sono pubbliche. Questa scheda è visibile solo a professionisti
              autorizzati e al proprietario.
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Proprietario
            </div>

            <div className="mt-2 text-sm font-semibold text-zinc-900">
              {animal?.owner_name || "Non disponibile"}
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div>
                <div className="text-xs text-zinc-500">Email</div>
                {animal?.owner_email ? (
                  <a
                    href={`mailto:${animal.owner_email}`}
                    className="font-medium text-zinc-800 underline underline-offset-2 hover:text-zinc-950"
                  >
                    {animal.owner_email}
                  </a>
                ) : (
                  <div className="text-zinc-600">—</div>
                )}
              </div>

              <div>
                <div className="text-xs text-zinc-500">Telefono</div>
                {animal?.owner_phone ? (
                  <a
                    href={`tel:${normalizePhone(animal.owner_phone)}`}
                    className="font-medium text-zinc-800 underline underline-offset-2 hover:text-zinc-950"
                  >
                    {animal.owner_phone}
                  </a>
                ) : (
                  <div className="text-zinc-600">—</div>
                )}
              </div>
            </div>
          </div>

          {!animal.owner_id && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/professionisti/animali/${animal.id}/collega-proprietario`}
                className="rounded-xl border px-4 py-2"
              >
                Collega proprietario
              </Link>

              <Link
                href={`/identita/nuovo?animalId=${animal.id}`}
                className="rounded-xl bg-black px-4 py-2 text-white"
              >
                Crea identità dalla cartella
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Stato clinico rapido</h2>
          </div>

          {eventsErr ? <span className="text-xs text-amber-700">{eventsErr}</span> : null}
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-sm font-semibold text-zinc-900">
            Età: {rapidClinicalState.age} | Peso: {rapidClinicalState.weight}
          </div>
          <div className="mt-2 text-sm text-zinc-600">
            Cartella clinica: accesso riservato ai veterinari autorizzati.
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Gruppo sanguigno</div>
            <div className="mt-1 font-semibold text-zinc-900">{rapidClinicalState.bloodType}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Allergie</div>

            {!Array.isArray(allergiesDisplay) ? (
              <div className="mt-1 font-semibold text-zinc-900">{allergiesDisplay}</div>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                {allergiesDisplay.map((item, index) => (
                  <li key={index} className="truncate">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Terapie attive</div>

            {!Array.isArray(activeTherapiesDisplay) ? (
              <div className="mt-1 font-semibold text-zinc-900">{activeTherapiesDisplay}</div>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                {activeTherapiesDisplay.map((item, index) => (
                  <li key={index} className="truncate">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Ultime terapie</div>

            {!Array.isArray(lastTherapiesDisplay) ? (
              <div className="mt-1 font-semibold text-zinc-900">{lastTherapiesDisplay}</div>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                {lastTherapiesDisplay.map((item, index) => (
                  <li key={index} className="truncate">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Patologie croniche</div>

            {!Array.isArray(chronicPathologiesDisplay) ? (
              <div className="mt-1 font-semibold text-zinc-900">
                {chronicPathologiesDisplay}
              </div>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                {chronicPathologiesDisplay.map((item, index) => (
                  <li key={index} className="truncate">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Ricontrolli programmati</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {rapidClinicalState.nextRecall || "—"}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Ultima visita</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {rapidClinicalState.latestVisit || "—"}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Ultima vaccinazione</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {rapidClinicalState.latestVaccination || "—"}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Vaccinazioni scadute / in scadenza</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {rapidClinicalState.vaccinationExpiry || "—"}
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Sintesi rapida della cartella clinica per valutazione immediata.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Identità</h2>

          <dl className="mt-3 grid gap-2 text-sm">
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
          </dl>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <div className="text-zinc-500">Sesso</div>
              <div className="font-semibold text-zinc-900">
                {animal.sex === "M" ? "Maschio" : animal.sex === "F" ? "Femmina" : "—"}
              </div>
            </div>

            <div>
              <div className="text-zinc-500">Sterilizzato</div>
              <div className="font-semibold text-zinc-900">
                {animal.sterilized === true ? "Sì" : animal.sterilized === false ? "No" : "—"}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Microchip</h2>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">Numero</div>

            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {animal.chip_number ? normalizeChip(animal.chip_number) : "— (non presente)"}
            </div>

            <div className="mt-2 text-xs text-zinc-600">
              Stato:{" "}
              {animal.microchip_verified ? (
                <span className="font-semibold text-emerald-700">Verificato ✅</span>
              ) : (
                <span className="font-semibold text-amber-700">Da verificare ⏳</span>
              )}
            </div>

            {animal.microchip_verified ? (
              <div className="mt-2 text-xs text-zinc-600">
                Verificato da:{" "}
                <span className="font-semibold text-zinc-900">{microchipVerifierLabel}</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <AnimalCodes
        qrValue={qrValue}
        barcodeValue={barcodeValue}
        caption="Da usare in emergenza o per verifica rapida."
      />
    </div>
  );
}