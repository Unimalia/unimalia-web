"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

export default function AnimalProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shareOpen, setShareOpen] = useState(false);

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

      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .eq("id", id)
        .single();

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

    load();
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

  const qrValue = useMemo(() => {
    if (!animal) return "";
    const code = (animal.unimalia_code || "").trim();
    if (code) return `UNIMALIA:${code}`;
    return `UNIMALIA:${animal.id}`;
  }, [animal]);

  const barcodeValue = useMemo(() => {
    if (!animal) return "";
    const chip = normalizeChip(animal.chip_number);
    if (chip) return chip;

    const code = (animal.unimalia_code || "").trim();
    if (code) return `UNIMALIA:${code}`;

    return `UNIMALIA:${animal.id}`;
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
        <div className="text-sm text-zinc-600">
          Sto caricando la scheda…
        </div>
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

  return (
    <PageShell
      title={animal.name}
      subtitle={`${animal.species}${animal.breed ? ` • ${animal.breed}` : ""} • ${statusLabel(
        animal.status
      )}`}
      backFallbackHref="/identita"
      actions={
        <>
          <ButtonSecondary href={`/identita/${animal.id}/modifica`}>
            Modifica
          </ButtonSecondary>

          <ButtonSecondary href={`/identita/${animal.id}/stampa`}>
            Stampa
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

          <ButtonPrimary href="/identita">
            Tutte le identità
          </ButtonPrimary>
        </>
      }
    >
      <OwnerGrantNotifier pathname={`/identita/${animal.id}`} />

      <div className="flex flex-col gap-6">
        <div className="text-xs text-zinc-500">
          Creato il {new Date(animal.created_at).toLocaleDateString("it-IT")}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-1">
            <h2 className="text-base font-semibold text-zinc-900">Identità</h2>

            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Nome</dt>
                <dd className="font-medium text-zinc-900">{animal.name}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-zinc-500">Tipo</dt>
                <dd className="font-medium text-zinc-900">{animal.species}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-zinc-500">Razza</dt>
                <dd className="font-medium text-zinc-900">
                  {animal.breed || "—"}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-zinc-500">Colore</dt>
                <dd className="font-medium text-zinc-900">
                  {animal.color || "—"}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-zinc-500">Taglia</dt>
                <dd className="font-medium text-zinc-900">
                  {animal.size || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-base font-semibold text-zinc-900">
              Codici
            </h2>

            <div className="mt-2">{codeStatusBadge}</div>

            <div className="mt-4">
              <AnimalCodes
                qrValue={qrValue}
                barcodeValue={barcodeValue}
                caption=""
                layout="stack"
              />
            </div>
          </section>
        </div>
      </div>

      {shareOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="text-base font-semibold">
              Condividi al professionista
            </div>

            <div className="mt-4 grid gap-2">
              <button
                className="w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold"
                onClick={() => {
                  alert("Veterinario di fiducia: non ancora impostato.");
                  setShareOpen(false);
                }}
              >
                Veterinario di fiducia
              </button>

              <button
                className="w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold"
                onClick={() => {
                  alert("Altro veterinario: flusso in definizione.");
                  setShareOpen(false);
                }}
              >
                Condividi ad altro veterinario
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}