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

function typeLabel(t: ClinicEventType) {
  switch (t) {
    case "visit":
      return "Visita";
    case "vaccine":
      return "Vaccinazione";
    case "exam":
      return "Esame";
    case "therapy":
      return "Terapia";
    case "note":
      return "Nota";
    case "document":
      return "Documento";
    case "emergency":
      return "Emergenza";
    case "weight":
      return "Peso";
    case "allergy":
      return "Allergia";
    case "feeding":
      return "Alimentazione";
    case "surgery":
      return "Intervento chirurgico";
    case "chronic_condition":
      return "Patologia cronica";
    case "follow_up":
      return "Ricontrollo";
    default:
      return t;
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

function formatEventDateIT(dateStr?: string | null) {
  if (!dateStr) return "—";

  const s = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return new Date(s).toLocaleDateString("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function normalizeChip(raw: string | null) {
  return (raw || "").replace(/\s+/g, "").trim();
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

function extractWeightKg(e: any): number | null {
  if (!e) return null;

  const direct =
    e.weight_kg ??
    e.weightKg ??
    e?.meta?.weight_kg ??
    e?.meta?.weightKg ??
    e?.data?.weightKg ??
    e?.data?.weight_kg ??
    e?.payload?.weightKg ??
    e?.payload?.weight_kg;

  if (direct === null || direct === undefined) return null;

  const n = typeof direct === "number" ? direct : Number(String(direct).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;

  return Math.round(n * 10) / 10;
}

function extractTherapyStartDate(e: any): string | null {
  return e?.meta?.therapy_start_date || null;
}

function extractTherapyEndDate(e: any): string | null {
  return e?.meta?.therapy_end_date || null;
}

function isTherapyActive(e: any) {
  if (!e || e.type !== "therapy") return false;

  const start = extractTherapyStartDate(e);
  const end = extractTherapyEndDate(e);

  if (!start) return false;

  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;

  if (!end) return true;
  return end >= todayYmd;
}

function formatWeightLabel(kg: number) {
  return Number.isInteger(kg) ? `${kg} kg` : `${kg} kg`;
}

function ownerConnectionLabel(animal: Animal) {
  if (animal.owner_id) return "Proprietario collegato";
  if (animal.owner_claim_status === "pending") return "Proprietario non collegato";
  return "Proprietario non collegato";
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

  function toDateOrNull(v?: string | null) {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const lastVisit = useMemo(() => {
    const list = (events || []).filter((e) => e.type === "visit" && e.event_date);
    list.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    return list[0] ?? null;
  }, [events]);

  const lastVaccine = useMemo(() => {
    const list = (events || []).filter((e) => e.type === "vaccine" && e.event_date);
    list.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    return list[0] ?? null;
  }, [events]);

  const lastWeight = useMemo(() => {
    const list = (events || [])
      .map((e) => ({ e, kg: extractWeightKg(e) }))
      .filter((x) => x.kg !== null && x.e?.event_date);

    list.sort((a, b) => new Date(b.e.event_date).getTime() - new Date(a.e.event_date).getTime());

    return list.length > 0
      ? { kg: list[0].kg as number, date: list[0].e.event_date as string }
      : null;
  }, [events]);

  const allergyItems = useMemo(() => {
    const list = (events || [])
      .filter((e) => e.type === "allergy")
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

    return list.slice(0, 3);
  }, [events]);

  const chronicConditions = useMemo(() => {
    return (events || [])
      .filter((e) => e.type === "chronic_condition")
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
      .slice(0, 3);
  }, [events]);

  const upcomingFollowUps = useMemo(() => {
    return (events || [])
      .filter((e) => e.type === "follow_up" && e.event_date)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 3);
  }, [events]);

  const activeTherapies = useMemo(() => {
    return (events || [])
      .filter((e) => e.type === "therapy" && isTherapyActive(e))
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
      .slice(0, 3);
  }, [events]);

  const latestTherapies = useMemo(() => {
    return (events || [])
      .filter((e) => e.type === "therapy" && !isTherapyActive(e))
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
      .slice(0, 3);
  }, [events]);

  const vaccinesDueSoonOrOverdue = useMemo(() => {
    const now = new Date();
    const limit = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const getDue = (e: ClinicEventRow) =>
      toDateOrNull(e.next_due_at) ||
      toDateOrNull(e.next_due_date) ||
      toDateOrNull(e.due_at) ||
      toDateOrNull(e.due_date) ||
      toDateOrNull(e.expires_at);

    const list = (events || [])
      .filter((e) => e.type === "vaccine")
      .map((e) => ({ e, due: getDue(e) }))
      .filter((x) => x.due && x.due.getTime() <= limit.getTime())
      .sort((a, b) => a.due!.getTime() - b.due!.getTime());

    return list;
  }, [events]);

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

        <div className="mt-4 rounded-2xl border p-5">
          <div className="flex flex-wrap items-center gap-2">
            {animal.owner_id ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                Proprietario collegato
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                Proprietario non collegato
              </span>
            )}

            {animal.created_by_org_id && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                Creato dalla clinica
              </span>
            )}

            {animal.unimalia_code && (
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800">
                UNIMALIA: {animal.unimalia_code}
              </span>
            )}
          </div>

          {!animal.owner_id && (
            <div className="mt-4 flex flex-wrap gap-2">
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

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <div className="font-semibold">Privacy</div>
          <div className="mt-1 text-sm text-zinc-600">
            Le identità NON sono pubbliche. Questa scheda è visibile solo a professionisti
            autorizzati e al proprietario.
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={
                animal.owner_id
                  ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
              }
            >
              {ownerConnectionLabel(animal)}
            </span>

            {animal.created_by_role === "professional" ? (
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                Creato dalla clinica
              </span>
            ) : null}

            {animal.unimalia_code ? (
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-mono text-zinc-700">
                UNIMALIA: {animal.unimalia_code}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Stato clinico rapido</h2>

            <div className="flex items-center gap-3 text-sm text-zinc-600">
              <span>Età: {formatAgeFromBirthDate(animal?.birth_date)}</span>

              {animal?.birth_date && animal?.birth_date_is_estimated ? (
                <span className="text-xs text-zinc-500">(presunta)</span>
              ) : null}

              <span className="text-zinc-300">|</span>

              <span>
                Peso:{" "}
                {lastWeight ? (
                  <>
                    {formatWeightLabel(lastWeight.kg)}{" "}
                    <span className="text-zinc-500">• {formatEventDateIT(lastWeight.date)}</span>
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>

          {eventsErr ? <span className="text-xs text-amber-700">{eventsErr}</span> : null}
        </div>

        <div className="mt-4 grid gap-3 text-sm md:grid-cols-7">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Allergie</div>
            {allergyItems.length === 0 ? (
              <div className="mt-1 font-semibold text-zinc-900">—</div>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                {allergyItems.map((a) => (
                  <li key={a.id} className="truncate">
                    <span className="font-semibold">{a.description || a.title || "Allergia"}</span>
                    <span className="text-zinc-500"> • {formatEventDateIT(a.event_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Terapie attive</div>
            {activeTherapies.length === 0 ? (
              <div className="mt-1 font-semibold text-zinc-900">—</div>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                {activeTherapies.map((t) => (
                  <li key={t.id} className="truncate">
                    <span className="font-semibold">{t.description || t.title || "Terapia"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Ultime terapie</div>
            {latestTherapies.length === 0 ? (
              <div className="mt-1 font-semibold text-zinc-900">—</div>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                {latestTherapies.map((t) => (
                  <li key={t.id} className="truncate">
                    <span className="font-semibold">{t.description || t.title || "Terapia"}</span>
                    <span className="text-zinc-500"> • {formatEventDateIT(t.event_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Patologie croniche</div>

            {chronicConditions.length === 0 ? (
              <div className="mt-1 font-semibold text-zinc-900">—</div>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                {chronicConditions.map((c) => (
                  <li key={c.id} className="truncate">
                    <span className="font-semibold">
                      {c.description || c.title || "Patologia"}
                    </span>
                    <span className="text-zinc-500"> • {formatEventDateIT(c.event_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Ricontrolli programmati</div>

            {upcomingFollowUps.length === 0 ? (
              <div className="mt-1 font-semibold text-zinc-900">—</div>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                {upcomingFollowUps.map((f) => (
                  <li key={f.id} className="truncate">
                    <span className="font-semibold">
                      {f.description || f.title || "Ricontrollo"}
                    </span>
                    <span className="text-zinc-500"> • {formatEventDateIT(f.event_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Ultima visita</div>
            <div className="mt-1 font-semibold text-zinc-900">
              {lastVisit ? formatEventDateIT(lastVisit.event_date) : "—"}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">Ultima vaccinazione</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {lastVaccine ? formatEventDateIT(lastVaccine.event_date) : "—"}
            </div>

            <div className="mt-2 text-xs text-zinc-500">Vaccinazioni scadute / in scadenza</div>

            {vaccinesDueSoonOrOverdue.length === 0 ? (
              <div className="mt-1 text-xs font-semibold text-zinc-900">—</div>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-zinc-800">
                {vaccinesDueSoonOrOverdue.slice(0, 3).map(({ e, due }) => {
                  const isOver = due!.getTime() < Date.now();
                  return (
                    <li key={e.id} className="truncate">
                      <span className="font-semibold">{e.title || "Vaccino"}</span>
                      <span className={isOver ? "text-red-700" : "text-amber-700"}>
                        {" "}
                        • {isOver ? "scaduta" : "in scadenza"}{" "}
                        {due ? formatEventDateIT(due.toISOString()) : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
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

          <div className="mt-4 flex flex-wrap gap-2">
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

            <Link
              href={`/professionisti/animali/${animal.id}/storia`}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Storia servizi (in arrivo)
            </Link>
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
        qrValue={qrValue || `UNIMALIA:${animal.id}`}
        barcodeValue={barcodeValue}
        caption="Da usare in emergenza o per verifica rapida."
      />
    </div>
  );
}