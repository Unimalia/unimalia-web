"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isVetUser } from "@/app/professionisti/_components/ProShell";
import { AnimalCodes } from "@/_components/animal/animal-codes";
import { authHeaders } from "@/lib/client/authHeaders";

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
  unimalia_code?: string | null;
  photo_url?: string | null;

  microchip_verified_at?: string | null;
  microchip_verified_org_id?: string | null;

  // se vuoi (in futuro via join o api)
  microchip_verified_by_label?: string | null;
};

type ClinicEventType =
  | "visit"
  | "vaccine"
  | "exam"
  | "therapy"
  | "note"
  | "document"
  | "emergency";

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

  // ✅ futuri campi (se presenti non rompono)
  verified_by_label?: string | null;
  verified_by_org_id?: string | null;
  verified_by_member_id?: string | null;
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
    default:
      return t;
  }
}

function formatDateIT(iso: string) {
  try {
    return new Date(iso).toLocaleString("it-IT", {
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
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (!id) return "";
    return origin ? `${origin}/scansiona/animali/${id}` : `UNIMALIA:${id}`;
  }, [id]);

  const barcodeValue = useMemo(() => {
    if (!animal) return "";
    const chip = normalizeChip(animal.chip_number);
    if (chip) return chip;
    const code = (animal.unimalia_code || "").trim();
    if (code) return `UNIMALIA:${code}`;
    return `UNIMALIA:${animal.id}`;
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

    const { data, error } = await supabase.from("animals").select("*").eq("id", id).single();

    if (error || !data) {
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
  }, [animal?.microchip_verified, animal?.microchip_verified_by_label, animal?.microchip_verified_at]);

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
      {/* HEADER */}
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
          <div className="font-semibold">Privacy</div>
          <div className="mt-1 text-sm text-zinc-600">
            Le identità NON sono pubbliche. Questa scheda è visibile solo a professionisti autorizzati
            e al proprietario.
          </div>
        </div>
      </div>

      {/* IDENTITÀ + MICROCHIP */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Identità</h2>

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
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {isVet ? (
              <Link
                href={`/professionisti/animali/${animal.id}/clinica`}
                className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
              >
                Cartella clinica
              </Link>
            ) : (
              <span
                className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600"
                title="Accesso riservato ai veterinari"
              >
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

          <p className="mt-3 text-xs text-zinc-500">
            La “Storia servizi” sarà visibile a tutti i professionisti (toelettatura, pet sitter, walking, pensione…).
            La cartella clinica è riservata ai veterinari.
          </p>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
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

          <div className="mt-4 flex flex-wrap gap-2">
            {isVet ? (
              animal.microchip_verified ? (
                <span className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Già verificato ✅
                </span>
              ) : (
                <Link
                  href={`/professionisti/animali/${animal.id}/verifica`}
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
                >
                  Vai alla verifica
                </Link>
              )
            ) : (
              <span className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">
                Verifica riservata al vet
              </span>
            )}

            <button
              type="button"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              onClick={() => void loadAnimal()}
            >
              Aggiorna stato
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Nota: alcuni animali possono non avere microchip. In quel caso UNIMALIA usa un codice interno.
          </p>
        </section>
      </div>

      {/* QR + BARCODE */}
      <AnimalCodes
        qrValue={qrValue || `UNIMALIA:${animal.id}`}
        barcodeValue={barcodeValue}
        caption="Da usare in emergenza o per verifica rapida."
      />
    </div>
  );
}