"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isVetUser } from "@/app/professionisti/_components/ProShell";

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  chip_number: string | null;
  microchip_verified: boolean;

  // ✅ nuovi (se hai fatto SQL A)
  microchip_verified_at?: string | null;
  microchip_verified_by?: string | null;
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
  verified_by_label?: string | null;
  created_at: string;
};

function normalizeChip(raw: string | null) {
  return (raw || "").replace(/\s+/g, "").trim();
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

export default function ProVerifyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const animalId = params?.id;

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loadingAnimal, setLoadingAnimal] = useState(true);

  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [savingChip, setSavingChip] = useState(false);
  const [validating, setValidating] = useState(false);

  const [err, setErr] = useState<string | null>(null);

  const backHref = useMemo(
    () => (animalId ? `/professionisti/animali/${animalId}` : "/professionisti"),
    [animalId]
  );

  // ✅ Gate: solo vet
  useEffect(() => {
    let alive = true;

    async function check() {
      setChecking(true);
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!alive) return;

      if (!user) {
        router.replace(
          "/professionisti/login?next=" +
            encodeURIComponent(`/professionisti/animali/${animalId}/verifica`)
        );
        return;
      }

      if (!isVetUser(user)) {
        setAuthorized(false);
        setChecking(false);
        return;
      }

      setAuthorized(true);
      setChecking(false);
    }

    check();
    return () => {
      alive = false;
    };
  }, [router, animalId]);

  // Carica animale
  useEffect(() => {
    let alive = true;

    async function loadAnimal() {
      if (!authorized || !animalId) return;

      setLoadingAnimal(true);
      setErr(null);

      const { data, error } = await supabase
        .from("animals")
        .select(
          "id,name,species,breed,chip_number,microchip_verified,microchip_verified_at,microchip_verified_by,microchip_verified_by_label"
        )
        .eq("id", animalId)
        .single();

      if (!alive) return;

      if (error || !data) {
        setErr("Animale non trovato.");
        setAnimal(null);
        setLoadingAnimal(false);
        return;
      }

      setAnimal(data as Animal);
      setLoadingAnimal(false);
    }

    loadAnimal();
    return () => {
      alive = false;
    };
  }, [authorized, animalId]);

  async function loadEvents() {
    if (!animalId) return;

    setLoadingEvents(true);
    setErr(null);

    try {
      // ✅ FIX: prendi email e passala in header
      const { data: authData } = await supabase.auth.getUser();
      const email = authData.user?.email || "";

      const res = await fetch(`/api/clinic-events/list?animalId=${encodeURIComponent(animalId)}`, {
        cache: "no-store",
        headers: {
          "x-user-email": email,
        },
      });

      if (!res.ok) {
        setEvents([]);
        setErr("Cartella clinica: accesso riservato ai veterinari autorizzati.");
        setLoadingEvents(false);
        return;
      }

      const json = await res.json().catch(() => ({}));
      const list = (json?.events as ClinicEventRow[]) ?? [];
      setEvents(list);

      // init selezione: di default false
      const nextSel: Record<string, boolean> = {};
      for (const ev of list) nextSel[ev.id] = false;
      setSelected(nextSel);
    } catch {
      setEvents([]);
      setErr("Errore di rete nel caricamento eventi.");
    } finally {
      setLoadingEvents(false);
    }
  }

  useEffect(() => {
    if (!authorized || !animalId) return;
    void loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, animalId]);

  const pendingEvents = useMemo(() => {
    return events.filter((e) => !e.verified_at && e.source === "owner");
  }, [events]);

  const selectedIds = useMemo(() => {
    return Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }, [selected]);

  const allPendingIds = useMemo(() => pendingEvents.map((e) => e.id), [pendingEvents]);

  async function onVerifyChip() {
    if (!animalId) return;

    setSavingChip(true);
    setErr(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user || !isVetUser(user)) {
      setSavingChip(false);
      setErr("Non autorizzato.");
      return;
    }

    // ✅ scrive anche “chi” (se colonne presenti)
    const now = new Date().toISOString();
    const verifierLabel = "Veterinario"; // poi: "Clinica X" o "Clinica X — Dott. Y"

    const { error } = await supabase
      .from("animals")
      .update({
        microchip_verified: true,
        microchip_verified_at: now,
        microchip_verified_by: user.id,
        microchip_verified_by_label: verifierLabel,
      })
      .eq("id", animalId);

    if (error) {
      setSavingChip(false);
      setErr(error.message);
      return;
    }

    // refresh animale
    const { data } = await supabase
      .from("animals")
      .select(
        "id,name,species,breed,chip_number,microchip_verified,microchip_verified_at,microchip_verified_by,microchip_verified_by_label"
      )
      .eq("id", animalId)
      .single();

    setAnimal((data as Animal) ?? null);
    setSavingChip(false);
  }

  async function validateMany(ids: string[]) {
    if (!ids.length) return;

    setValidating(true);
    setErr(null);

    try {
      // prima versione: chiamate in sequenza (robusta)
      for (const id of ids) {
        const res = await fetch("/api/clinic-events/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: id }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Errore validazione evento");
        }
      }

      await loadEvents();
    } catch (e: any) {
      setErr(e?.message || "Errore durante la validazione.");
    } finally {
      setValidating(false);
    }
  }

  if (checking) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-3xl border bg-white p-6">
          <div className="text-sm text-zinc-600">Verifica accesso…</div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="text-sm">
          <Link href="/professionisti" className="font-semibold text-zinc-700 hover:text-zinc-900">
            ← Portale
          </Link>
        </div>

        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Accesso non autorizzato</h1>
          <p className="mt-2 text-sm text-zinc-700">
            Questa sezione è riservata ai veterinari autorizzati.
          </p>

          <div className="mt-4">
            <Link
              href="/professionisti"
              className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900"
            >
              Torna al portale
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Validazione (vet)</h1>
          <p className="text-sm text-zinc-600">
            Microchip + validazione eventi clinici inseriti dall’owner.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={backHref}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Torna
          </Link>
          <Link
            href="/professionisti/scansiona"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Scanner
          </Link>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      {/* MICROCHIP */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        {loadingAnimal ? (
          <div className="text-sm text-zinc-600">Caricamento animale…</div>
        ) : !animal ? (
          <div className="text-sm text-zinc-700">Animale non disponibile.</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold text-zinc-900">{animal.name}</div>
              <div className="text-sm text-zinc-600">
                {animal.species}
                {animal.breed ? ` • ${animal.breed}` : ""}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Microchip</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                {animal.chip_number
                  ? normalizeChip(animal.chip_number)
                  : "— (nessun microchip registrato)"}
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
                  <span className="font-semibold text-zinc-900">
                    {(animal.microchip_verified_by_label || "Veterinario").trim()}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onVerifyChip}
                disabled={savingChip || !animal || animal.microchip_verified}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
              >
                {savingChip
                  ? "Salvataggio…"
                  : animal.microchip_verified
                  ? "Già verificato"
                  : "Segna come verificato"}
              </button>

              <Link
                href={`/professionisti/animali/${animal.id}`}
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Vai alla scheda
              </Link>
            </div>

            <p className="text-xs text-zinc-500">
              Nota: alcuni animali possono non avere microchip. In quel caso UNIMALIA usa un codice interno.
            </p>
          </div>
        )}
      </div>

      {/* EVENTI: CHECKLIST */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Eventi clinici (owner)</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Seleziona gli eventi da validare oppure valida tutto in un click.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadEvents()}
            disabled={loadingEvents || validating}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
          >
            Aggiorna
          </button>
        </div>

        {loadingEvents ? (
          <div className="text-sm text-zinc-600">Caricamento eventi…</div>
        ) : pendingEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
            Nessun evento da validare.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void validateMany(selectedIds)}
                disabled={validating || selectedIds.length === 0}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
              >
                {validating ? "Validazione…" : "Valida selezionati"}
              </button>

              <button
                type="button"
                onClick={() => void validateMany(allPendingIds)}
                disabled={validating || allPendingIds.length === 0}
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                {validating ? "Validazione…" : "Valida tutto"}
              </button>

              <button
                type="button"
                onClick={() => {
                  const next: Record<string, boolean> = {};
                  for (const ev of pendingEvents) next[ev.id] = true;
                  setSelected((prev) => ({ ...prev, ...next }));
                }}
                disabled={validating}
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                Seleziona tutto
              </button>

              <button
                type="button"
                onClick={() => {
                  const next: Record<string, boolean> = {};
                  for (const ev of pendingEvents) next[ev.id] = false;
                  setSelected((prev) => ({ ...prev, ...next }));
                }}
                disabled={validating}
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                Deseleziona
              </button>
            </div>

            <div className="mt-2 flex flex-col gap-3">
              {pendingEvents.map((ev) => (
                <label
                  key={ev.id}
                  className="flex gap-3 rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(selected[ev.id])}
                    onChange={(e) => setSelected((s) => ({ ...s, [ev.id]: e.target.checked }))}
                    className="mt-1"
                  />

                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500">{formatDateIT(ev.event_date)}</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                      {typeLabel(ev.type)}
                      <span className="ml-2 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        ⏳ Da validare
                      </span>
                    </div>

                    {ev.description ? (
                      <p className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">
                        {ev.description}
                      </p>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          Nota: ogni evento validato mostrerà “Validato da Clinica/Veterinario” e sarà tracciabile.
        </div>
      </div>
    </div>
  );
}