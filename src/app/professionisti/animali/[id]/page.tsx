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
  microchip_verified_by_organization_id?: string | null;
  microchip_verified_by_label?: string | null;

  birth_date?: string | null;
  birth_date_is_estimated?: boolean | null;

  owner_claim_status?: "none" | "pending" | "claimed" | null;
  created_by_role?: string | null;
  created_by_organization_id?: string | null;
  origin_organization_id?: string | null;

  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;

  pending_owner_email?: string | null;
  pending_owner_phone?: string | null;
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

  verified_by_label?: string | null;
  verified_by_organization_id?: string | null;
  verified_by_member_id?: string | null;

  due_date?: string | null;
  due_at?: string | null;
  next_due_date?: string | null;
  next_due_at?: string | null;
  expires_at?: string | null;

  weight_kg?: number | null;
  weightKg?: number | null;
  data?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
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

function ownerConnectionLabel(animal: Animal) {
  if (animal.owner_id) return "Proprietario collegato";
  if (animal.owner_claim_status === "pending") return "Proprietario non collegato";
  return "Proprietario non collegato";
}

function displayList(items: string[] | undefined, fallback = "—") {
  if (!items || items.length === 0) return fallback;
  return items;
}

function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_10px_28px_rgba(42,56,86,0.05)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#30486f]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-7 text-[#5f708a]">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function ProAnimalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [isVet, setIsVet] = useState(false);

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

  const visibleOwnerEmail = useMemo(() => {
    if (!animal) return null;
    return animal.owner_email || animal.pending_owner_email || null;
  }, [animal]);

  const visibleOwnerPhone = useMemo(() => {
    if (!animal) return null;
    return animal.owner_phone || animal.pending_owner_phone || null;
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
          return;
        }
        setEvents([]);
        setEventsErr("Impossibile caricare la cartella clinica (errore server).");
        return;
      }

      const json = await res.json().catch(() => ({}));
      setEvents((json?.events as ClinicEventRow[]) ?? []);
    } catch {
      setEvents([]);
      setEventsErr("Errore di rete durante il caricamento eventi.");
    }
  }

  useEffect(() => {
    void loadAnimal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!animal?.id || !isVet) {
      setEvents([]);
      setEventsErr(null);
      return;
    }
    void loadClinicEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal?.id, isVet]);

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
      events: isVet ? events ?? [] : [],
    });
  }, [animal, events, isVet]);

  if (loading) {
    return (
      <div className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_10px_28px_rgba(42,56,86,0.05)]">
        <div className="text-sm text-[#5f708a]">Caricamento scheda…</div>
      </div>
    );
  }

  if (err || !animal) {
    return (
      <div className="space-y-4">
        <div className="text-sm">
          <Link
            href="/professionisti/animali"
            className="font-semibold text-[#5f708a] hover:text-[#30486f]"
          >
            ← Scanner
          </Link>
        </div>

        <div className="rounded-[1.75rem] border border-red-200 bg-white p-6 shadow-[0_10px_28px_rgba(42,56,86,0.05)]">
          <div className="text-lg font-semibold text-[#30486f]">Animale (Professionisti)</div>
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
      <section className="overflow-hidden rounded-[2rem] border border-[#dde4ec] bg-white shadow-[0_18px_45px_rgba(42,56,86,0.07)]">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="px-6 py-7 sm:px-8 sm:py-8">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                Scheda animale
              </p>

              <h1 className="mt-4 truncate text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl">
                {animal.name}
              </h1>

              <p className="mt-3 text-sm leading-7 text-[#5f708a] sm:text-base">
                {animal.species}
                {animal.breed ? ` • ${animal.breed}` : ""} • {statusLabel(animal.status)}
              </p>

              <p className="mt-3 text-xs text-[#6f7d91]">
                ID: <span className="font-mono">{animal.id}</span> • Creato il{" "}
                {new Date(animal.created_at).toLocaleDateString("it-IT")}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/professionisti/animali"
                className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
              >
                Torna allo scanner
              </Link>

              <Link
                href={`/professionisti/animali/${animal.id}/storia`}
                className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
              >
                Storia animale
              </Link>

              <Link
                href="/professionisti/richieste-accesso"
                className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
              >
                Richieste accesso
              </Link>

              <Link
                href={`/professionisti/richieste-accesso?animalId=${encodeURIComponent(id)}`}
                className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
              >
                Richiedi accesso
              </Link>

              {!animal.owner_id ? (
                <>
                  <Link
                    href={`/professionisti/animali/${animal.id}/collega-proprietario`}
                    className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    Collega proprietario
                  </Link>

                  <Link
                    href={`/identita/nuovo?animalId=${encodeURIComponent(animal.id)}`}
                    className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                  >
                    Crea identità dalla cartella
                  </Link>
                </>
              ) : null}

              {isVet ? (
                animal.microchip_verified ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                    Microchip verificato ✅
                  </span>
                ) : (
                  <Link
                    href={`/professionisti/animali/${animal.id}/verifica`}
                    className="rounded-full bg-[#30486f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                  >
                    Verifica microchip
                  </Link>
                )
              ) : (
                <span className="rounded-full border border-[#e3e9f0] bg-[#fbfdff] px-4 py-2.5 text-sm font-semibold text-[#6f7d91]">
                  Solo vet può verificare
                </span>
              )}
            </div>
          </div>

          <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-6 py-7 sm:px-8 sm:py-8">
            <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_10px_24px_rgba(42,56,86,0.05)]">
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

                {(animal.created_by_organization_id || animal.created_by_role === "professional") && (
                  <span className="rounded-full border border-[#d7dfe9] bg-white px-3 py-1 text-xs font-semibold text-[#4f6078]">
                    Creato dalla clinica
                  </span>
                )}

                {animal.unimalia_code ? (
                  <span className="rounded-full border border-[#d7dfe9] bg-white px-3 py-1 text-xs font-mono text-[#4f6078]">
                    UNIMALIA: {animal.unimalia_code}
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold text-[#30486f]">Privacy</div>
                <div className="mt-1 text-sm leading-7 text-[#5f708a]">
                  Le identità non sono pubbliche. Questa scheda è visibile solo a professionisti
                  autorizzati e al proprietario.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <SectionCard title="Proprietario" subtitle="Dati visibili lato professionista.">
            <div className="rounded-[1.3rem] border border-[#e3e9f0] bg-[#fbfdff] p-4">
              <div className="text-sm font-semibold text-[#30486f]">
                {animal?.owner_name || "Non disponibile"}
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7d91]">
                    Email
                  </div>
                  {visibleOwnerEmail ? (
                    <a
                      href={`mailto:${visibleOwnerEmail}`}
                      className="mt-1 inline-block break-all font-medium text-[#30486f] underline underline-offset-4 hover:text-[#243750]"
                    >
                      {visibleOwnerEmail}
                    </a>
                  ) : (
                    <div className="mt-1 text-[#5f708a]">—</div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7d91]">
                    Telefono
                  </div>
                  {visibleOwnerPhone ? (
                    <a
                      href={`tel:${normalizePhone(visibleOwnerPhone)}`}
                      className="mt-1 inline-block font-medium text-[#30486f] underline underline-offset-4 hover:text-[#243750]"
                    >
                      {visibleOwnerPhone}
                    </a>
                  ) : (
                    <div className="mt-1 text-[#5f708a]">—</div>
                  )}
                </div>
              </div>
            </div>

            {!animal.owner_id ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/professionisti/animali/${animal.id}/collega-proprietario`}
                  className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Collega proprietario
                </Link>

                <Link
                  href={`/identita/nuovo?animalId=${animal.id}`}
                  className="rounded-full bg-[#30486f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                >
                  Crea identità dalla cartella
                </Link>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Stato clinico rapido" subtitle="Sintesi immediata lato professionista.">
            <div className="rounded-[1.25rem] border border-[#e3e9f0] bg-[#f8fbff] p-4">
              <div className="text-sm font-semibold text-[#30486f]">
                Età: {rapidClinicalState.age} | Peso: {rapidClinicalState.weight}
              </div>
              <div className="mt-2 text-sm leading-7 text-[#5f708a]">
                {isVet
                  ? "Sintesi rapida della cartella clinica veterinaria."
                  : "Per i professionisti non clinici la sezione operativa principale è Storia animale."}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.15rem] border border-[#e3e9f0] bg-[#fbfdff] p-3">
                <div className="text-xs text-[#6f7d91]">Gruppo sanguigno</div>
                <div className="mt-1 font-semibold text-[#30486f]">
                  {isVet ? rapidClinicalState.bloodType : "Riservato ai vet"}
                </div>
              </div>

              <div className="rounded-[1.15rem] border border-[#e3e9f0] bg-[#fbfdff] p-3">
                <div className="text-xs text-[#6f7d91]">Allergie</div>

                {!isVet ? (
                  <div className="mt-1 font-semibold text-[#30486f]">Riservato ai vet</div>
                ) : !Array.isArray(allergiesDisplay) ? (
                  <div className="mt-1 font-semibold text-[#30486f]">{allergiesDisplay}</div>
                ) : (
                  <ul className="mt-1 space-y-1 text-xs text-[#30486f]">
                    {allergiesDisplay.map((item, index) => (
                      <li key={index} className="truncate">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-[1.15rem] border border-[#e3e9f0] bg-[#fbfdff] p-3">
                <div className="text-xs text-[#6f7d91]">Terapie attive</div>

                {!isVet ? (
                  <div className="mt-1 font-semibold text-[#30486f]">Riservato ai vet</div>
                ) : !Array.isArray(activeTherapiesDisplay) ? (
                  <div className="mt-1 font-semibold text-[#30486f]">{activeTherapiesDisplay}</div>
                ) : (
                  <ul className="mt-1 space-y-1 text-xs text-[#30486f]">
                    {activeTherapiesDisplay.map((item, index) => (
                      <li key={index} className="truncate">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-[1.15rem] border border-[#e3e9f0] bg-[#fbfdff] p-3">
                <div className="text-xs text-[#6f7d91]">Ultime terapie</div>

                {!isVet ? (
                  <div className="mt-1 font-semibold text-[#30486f]">Riservato ai vet</div>
                ) : !Array.isArray(lastTherapiesDisplay) ? (
                  <div className="mt-1 font-semibold text-[#30486f]">{lastTherapiesDisplay}</div>
                ) : (
                  <ul className="mt-1 space-y-1 text-xs text-[#30486f]">
                    {lastTherapiesDisplay.map((item, index) => (
                      <li key={index} className="truncate">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-[1.15rem] border border-[#e3e9f0] bg-[#fbfdff] p-3">
                <div className="text-xs text-[#6f7d91]">Patologie croniche</div>

                {!isVet ? (
                  <div className="mt-1 font-semibold text-[#30486f]">Riservato ai vet</div>
                ) : !Array.isArray(chronicPathologiesDisplay) ? (
                  <div className="mt-1 font-semibold text-[#30486f]">{chronicPathologiesDisplay}</div>
                ) : (
                  <ul className="mt-1 space-y-1 text-xs text-[#30486f]">
                    {chronicPathologiesDisplay.map((item, index) => (
                      <li key={index} className="truncate">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-[1.15rem] border border-[#e3e9f0] bg-[#fbfdff] p-3">
                <div className="text-xs text-[#6f7d91]">Ricontrolli programmati</div>
                <div className="mt-1 font-semibold text-[#30486f]">
                  {isVet ? rapidClinicalState.nextRecall || "—" : "Riservato ai vet"}
                </div>
              </div>

              <div className="rounded-[1.15rem] border border-[#e3e9f0] bg-[#fbfdff] p-3">
                <div className="text-xs text-[#6f7d91]">Ultima visita</div>
                <div className="mt-1 font-semibold text-[#30486f]">
                  {isVet ? rapidClinicalState.latestVisit || "—" : "Riservato ai vet"}
                </div>
              </div>

              <div className="rounded-[1.15rem] border border-[#e3e9f0] bg-[#fbfdff] p-3">
                <div className="text-xs text-[#6f7d91]">Ultima vaccinazione</div>
                <div className="mt-1 font-semibold text-[#30486f]">
                  {isVet ? rapidClinicalState.latestVaccination || "—" : "Riservato ai vet"}
                </div>
              </div>

              <div className="rounded-[1.15rem] border border-[#e3e9f0] bg-[#fbfdff] p-3">
                <div className="text-xs text-[#6f7d91]">Vaccinazioni scadute / in scadenza</div>
                <div className="mt-1 font-semibold text-[#30486f]">
                  {isVet ? rapidClinicalState.vaccinationExpiry || "—" : "Riservato ai vet"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isVet ? (
                <Link
                  href={`/professionisti/animali/${animal.id}/clinica`}
                  className="rounded-full bg-[#30486f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                >
                  Cartella clinica
                </Link>
              ) : (
                <Link
                  href={`/professionisti/animali/${animal.id}/storia`}
                  className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Vai a Storia animale
                </Link>
              )}

              {eventsErr ? <span className="text-xs text-amber-700">{eventsErr}</span> : null}
            </div>

            <p className="text-xs text-[#6f7d91]">
              {isVet
                ? "Sintesi rapida della cartella clinica per valutazione immediata."
                : "I dati clinici dettagliati restano separati e riservati al ramo veterinario."}
            </p>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Identità" subtitle="Dati principali dell’animale.">
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#6f7d91]">Nome</dt>
                <dd className="font-medium text-[#30486f]">{animal.name}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-[#6f7d91]">Tipo</dt>
                <dd className="font-medium text-[#30486f]">{animal.species}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-[#6f7d91]">Razza</dt>
                <dd className="font-medium text-[#30486f]">{animal.breed || "—"}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-[#6f7d91]">Colore / segni</dt>
                <dd className="font-medium text-[#30486f]">{animal.color || "—"}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-[#6f7d91]">Taglia</dt>
                <dd className="font-medium text-[#30486f]">{animal.size || "—"}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-[#6f7d91]">Sesso</dt>
                <dd className="font-medium text-[#30486f]">
                  {animal.sex === "M" ? "Maschio" : animal.sex === "F" ? "Femmina" : "—"}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-[#6f7d91]">Sterilizzato</dt>
                <dd className="font-medium text-[#30486f]">
                  {animal.sterilized === true ? "Sì" : animal.sterilized === false ? "No" : "—"}
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Microchip e codici" subtitle="Verifica rapida e identificazione.">
            <div className="rounded-[1.25rem] border border-[#e3e9f0] bg-[#f8fbff] p-4">
              <div className="text-xs text-[#6f7d91]">Numero</div>

              <div className="mt-1 text-sm font-semibold text-[#30486f]">
                {animal.chip_number ? normalizeChip(animal.chip_number) : "— (non presente)"}
              </div>

              <div className="mt-2 text-xs text-[#5f708a]">
                Stato:{" "}
                {animal.microchip_verified ? (
                  <span className="font-semibold text-emerald-700">Verificato ✅</span>
                ) : (
                  <span className="font-semibold text-amber-700">Da verificare ⏳</span>
                )}
              </div>

              {animal.microchip_verified ? (
                <div className="mt-2 text-xs text-[#5f708a]">
                  Verificato da:{" "}
                  <span className="font-semibold text-[#30486f]">{microchipVerifierLabel}</span>
                </div>
              ) : null}
            </div>

            <AnimalCodes
              qrValue={qrValue}
              barcodeValue={barcodeValue}
              caption="Da usare in emergenza o per verifica rapida."
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}