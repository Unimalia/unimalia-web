"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { PageShell } from "@/_components/ui/page-shell";
import { ButtonPrimary, ButtonSecondary } from "@/_components/ui/button";
import { AnimalCodes } from "@/_components/animal/animal-codes";

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

    load();
    return () => {
      alive = false;
    };
  }, [id, router]);

  const premiumOk = useMemo(() => {
    if (!animal) return false;
    if (!animal.premium_active) return false;
    if (!animal.premium_expires_at) return true;
    return new Date(animal.premium_expires_at).getTime() > Date.now();
  }, [animal]);

  // ✅ QR PRIVACY-SAFE: niente URL, solo codice UNIMALIA
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

  return (
    <PageShell
      title={animal.name}
      subtitle={`${animal.species}${animal.breed ? ` • ${animal.breed}` : ""} • ${statusLabel(animal.status)}`}
      backFallbackHref="/identita"
      actions={
        <>
          <ButtonSecondary href={`/identita/${animal.id}/modifica`}>Modifica</ButtonSecondary>
          <ButtonSecondary href={`/identita/${animal.id}/stampa`}>Stampa</ButtonSecondary>

          {/* A) Condividi al professionista (porta a Richieste consulto precompilata) */}
          <ButtonSecondary href={`/professionisti/richieste?animal=${animal.id}`}>
            Condividi al professionista
          </ButtonSecondary>

          <ButtonPrimary href="/identita">Tutte le identità</ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            Creato il {new Date(animal.created_at).toLocaleDateString("it-IT")}
          </p>

          {premiumOk ? (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              Premium attivo
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
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
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">Microchip</h2>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              {animal.chip_number ? (
                <>
                  <p className="text-sm font-semibold text-zinc-900">{normalizeChip(animal.chip_number)}</p>
                  <p className="mt-2 text-xs text-zinc-600">
                    {animal.microchip_verified ? "Verificato da professionista ✅" : "Non ancora verificato"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-700">Nessun microchip registrato.</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/identita/${animal.id}/modifica`}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Aggiorna dati
              </Link>

              {/* ✅ NON più "Pagina scansione" pubblica: i codici vanno allo scanner pro */}
              <Link
                href={`/professionisti/scansiona`}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Vai allo scanner professionisti
              </Link>
            </div>
          </section>
        </div>

        <AnimalCodes
          qrValue={qrValue || `UNIMALIA:${animal.id}`}
          barcodeValue={barcodeValue}
          caption="Da usare in emergenza o per verifica rapida."
        />

        {/* B) Cartella clinica (UI pronta) */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Cartella clinica</h2>
              <p className="mt-1 text-sm text-zinc-600">Referti, vaccinazioni, terapie e note. (Da creare)</p>
            </div>

            <Link
              href={`/identita/${animal.id}/clinica`}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Apri cartella
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
            Qui mostreremo timeline clinica + upload allegati + riepilogo. Per ora predisposizione UI.
          </div>
        </section>
      </div>
    </PageShell>
  );
}