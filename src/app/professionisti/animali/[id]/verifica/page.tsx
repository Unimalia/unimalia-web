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
};

function normalizeChip(raw: string | null) {
  return (raw || "").replace(/\s+/g, "").trim();
}

export default function ProVerifyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const animalId = params?.id;

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loadingAnimal, setLoadingAnimal] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingChip, setSavingChip] = useState(false);

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
        router.replace("/professionisti/login?next=" + encodeURIComponent(`/professionisti/animali/${animalId}/verifica`));
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

  // Carica animale (solo se autorizzato)
  useEffect(() => {
    let alive = true;

    async function loadAnimal() {
      if (!authorized || !animalId) return;

      setLoadingAnimal(true);
      setErr(null);

      const { data, error } = await supabase
        .from("animals")
        .select("id,name,species,breed,chip_number,microchip_verified")
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

    const { error } = await supabase
      .from("animals")
      .update({ microchip_verified: true })
      .eq("id", animalId);

    if (error) {
      setSavingChip(false);
      setErr(error.message);
      return;
    }

    // refresh
    const { data } = await supabase
      .from("animals")
      .select("id,name,species,breed,chip_number,microchip_verified")
      .eq("id", animalId)
      .single();

    setAnimal((data as Animal) ?? null);
    setSavingChip(false);
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

  // ✅ authorized vet UI
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Verifica microchip</h1>
          <p className="text-sm text-zinc-600">
            Validazione professionista: microchip + (prossimo step) storico clinico.
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
                {animal.chip_number ? normalizeChip(animal.chip_number) : "— (nessun microchip registrato)"}
              </div>

              <div className="mt-2 text-xs text-zinc-600">
                Stato:{" "}
                {animal.microchip_verified ? (
                  <span className="font-semibold text-emerald-700">Verificato ✅</span>
                ) : (
                  <span className="font-semibold text-amber-700">Da verificare ⏳</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onVerifyChip}
                disabled={savingChip || !animal || animal.microchip_verified}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
              >
                {savingChip ? "Salvataggio…" : animal.microchip_verified ? "Già verificato" : "Segna come verificato"}
              </button>

              <Link
                href={`/professionisti/animali/${animal.id}`}
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Vai alla scheda
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
              Prossimo step: qui aggiungiamo la checklist eventi clinici con “Valida selezionati / Valida tutto”.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}