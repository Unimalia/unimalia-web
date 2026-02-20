"use client";

export const dynamic = "force-dynamic";

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
  chip_number: string | null;
  microchip_verified: boolean;
  unimalia_code: string | null;
};

function normalizeChip(raw: string | null) {
  return (raw || "").replace(/\s+/g, "").trim();
}

export default function StampaAnimalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;

      setLoading(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.replace("/login?next=/identita/" + id + "/stampa");
        return;
      }

      const { data, error } = await supabase
        .from("animals")
        .select("id,owner_id,created_at,name,species,breed,chip_number,microchip_verified,unimalia_code")
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

  if (loading) {
    return (
      <PageShell title="Stampa" subtitle="Caricamento…" backFallbackHref="/identita">
        <div className="text-sm text-zinc-600">Caricamento…</div>
      </PageShell>
    );
  }

  if (error || !animal) {
    return (
      <PageShell title="Stampa" backFallbackHref="/identita">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error || "Profilo non trovato."}
        </div>
      </PageShell>
    );
  }

  return (
    <>
      {/* Print styles (non tocchiamo globals.css) */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-wrap { padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>

      <PageShell
        title={`Stampa — ${animal.name}`}
        subtitle={`${animal.species}${animal.breed ? ` • ${animal.breed}` : ""}`}
        backFallbackHref={`/identita/${animal.id}`}
        actions={
          <div className="no-print flex gap-2">
            <ButtonSecondary href={`/identita/${animal.id}`}>Torna alla scheda</ButtonSecondary>
            <ButtonPrimary
              onClick={() => {
                try {
                  window.print();
                } catch {}
              }}
            >
              Stampa
            </ButtonPrimary>
          </div>
        }
      >
        <div className="print-wrap flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500">UNIMALIA</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-900">{animal.name}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {animal.species}
              {animal.breed ? ` • ${animal.breed}` : ""}
            </p>

            <div className="mt-4 text-xs text-zinc-600">
              <div>
                Microchip:{" "}
                <span className="font-semibold text-zinc-900">
                  {normalizeChip(animal.chip_number) || "—"}
                </span>{" "}
                {animal.chip_number ? (
                  <span className="text-zinc-500">
                    ({animal.microchip_verified ? "verificato" : "non verificato"})
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <AnimalCodes
            qrValue={qrValue}
            barcodeValue={barcodeValue}
            caption="Da mostrare o stampare per emergenza/verifica."
          />

          <p className="no-print text-xs text-zinc-500">
            Suggerimento: stampa e metti una copia nel portadocumenti o nella custodia del guinzaglio.
          </p>
        </div>
      </PageShell>
    </>
  );
}