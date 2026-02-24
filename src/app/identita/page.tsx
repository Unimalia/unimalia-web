"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { PageShell } from "@/_components/ui/page-shell";
import { Card } from "@/_components/ui/card";
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
  photo_url: string | null;
  unimalia_code: string | null;
};

type OwnerProfile = {
  full_name: string | null;
  fiscal_code: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  cap: string | null;
};

function normalizeChip(raw: string) {
  return (raw || "").replace(/\s+/g, "").trim();
}

function statusBadge(status: string) {
  switch (status) {
    case "lost":
      return { label: "Smarrito", cls: "bg-red-50 text-red-700 border-red-200" };
    case "found":
      return { label: "Ritrovato", cls: "bg-sky-50 text-sky-700 border-sky-200" };
    case "home":
    case "safe":
    default:
      return { label: "A casa", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
}

function isProfileComplete(p: OwnerProfile | null) {
  if (!p) return false;
  const full = (p.full_name ?? "").trim().length >= 3;
  const cf = (p.fiscal_code ?? "").replace(/\s+/g, "").trim().toUpperCase().length === 16;
  const addr = (p.address ?? "").trim().length >= 5;
  const city = (p.city ?? "").trim().length >= 2;
  const prov = (p.province ?? "").trim().length === 2;
  const cap = (p.cap ?? "").trim().length === 5;
  return full && cf && addr && city && prov && cap;
}

function digitalBarcode(a: Animal) {
  const chip = normalizeChip(a.chip_number || "");
  if (chip) return chip;
  const code = a.unimalia_code?.trim();
  if (code) return `UNIMALIA:${code}`;
  return `UNIMALIA:${a.id}`;
}

export default function IdentitaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [profileOk, setProfileOk] = useState(true);

  // modal codice
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Animal | null>(null);

  const qrValue = useMemo(() => {
    if (!selected) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (origin) return `${origin}/scansiona/animali/${selected.id}`;
    return `UNIMALIA:${selected.id}`;
  }, [selected]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const user = authData.user;

      if (authErr || !user) {
        router.replace("/login?next=/identita");
        return;
      }

      const { data: pData } = await supabase
        .from("profiles")
        .select("full_name,fiscal_code,address,city,province,cap")
        .eq("id", user.id)
        .maybeSingle();

      if (!alive) return;
      setProfileOk(isProfileComplete((pData as OwnerProfile) || null));

      const { data, error } = await supabase
        .from("animals")
        .select(
          "id,owner_id,created_at,name,species,breed,color,size,chip_number,microchip_verified,status,photo_url,unimalia_code"
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (error) {
        setErr("Errore nel caricamento. Riprova.");
        setAnimals([]);
        setLoading(false);
        return;
      }

      setAnimals((data as Animal[]) || []);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [router]);

  function openCode(a: Animal) {
    setSelected(a);
    setOpen(true);
  }

  if (loading) {
    return (
      <PageShell
        title="Identità animale"
        subtitle="Caricamento…"
        backFallbackHref="/"
        boxed
        actions={<div className="h-9 w-32 rounded-lg bg-zinc-200/60" />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl border border-zinc-200 bg-white shadow-sm" />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Identità animale"
      subtitle="Le schede dei tuoi animali. Apri una scheda per gestire i dati."
      backFallbackHref="/"
      boxed={false}
      actions={<ButtonPrimary href="/identita/nuovo">+ Crea profilo</ButtonPrimary>}
    >
      {/* banner profilo */}
      {!profileOk ? (
        <div className="mb-6">
          <Card>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Completa il profilo proprietario</p>
                  <p className="mt-1 text-amber-900/80">
                    Serve per mostrare correttamente i tuoi dati ai professionisti.
                  </p>
                </div>
                <ButtonSecondary href="/profilo">Vai al profilo →</ButtonSecondary>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {/* error */}
      {err ? (
        <Card>
          <div className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700 shadow-sm">
            {err}
          </div>
        </Card>
      ) : null}

      {/* empty */}
      {!err && animals.length === 0 ? (
        <Card>
          <div className="p-2">
            <h2 className="text-base font-semibold text-zinc-900">Nessun profilo animale</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Crea la prima identità digitale del tuo animale.
            </p>
            <div className="mt-5">
              <ButtonPrimary href="/identita/nuovo">+ Crea profilo</ButtonPrimary>
            </div>
          </div>
        </Card>
      ) : null}

      {/* grid */}
      {animals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => {
            const st = statusBadge(a.status);

            return (
              <div
                key={a.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="relative h-44 bg-zinc-100">
                  <img
                    src={a.photo_url || "/placeholder-animal.jpg"}
                    alt={a.name}
                    className="h-44 w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder-animal.jpg";
                    }}
                  />
                  <div className="absolute left-3 top-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-zinc-900">{a.name}</h3>
                      <p className="mt-1 text-sm text-zinc-700">
                        {a.species}
                        {a.breed ? ` • ${a.breed}` : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-zinc-500">Creato</p>
                      <p className="text-xs font-medium text-zinc-700">
                        {new Date(a.created_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-zinc-500">Colore</span>
                      <span className="font-medium">{a.color || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-zinc-500">Taglia</span>
                      <span className="font-medium">{a.size || "—"}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <ButtonPrimary href={`/identita/${a.id}`}>Apri</ButtonPrimary>
                    <ButtonSecondary href={`/identita/${a.id}/modifica`}>Modifica</ButtonSecondary>
                    <button
                      type="button"
                      onClick={() => openCode(a)}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Codice
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* modal codici */}
      {open && selected ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-zinc-500">Codici</p>
                <h3 className="mt-1 text-xl font-semibold text-zinc-900">{selected.name}</h3>
                <p className="mt-1 text-sm text-zinc-700">
                  {selected.species}
                  {selected.breed ? ` • ${selected.breed}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-6">
              <AnimalCodes
                qrValue={qrValue}
                barcodeValue={digitalBarcode(selected)}
                caption="Stampa o mostra rapidamente in caso di necessità."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonSecondary href={`/scansiona/animali/${selected.id}`}>
                Pagina scansione →
              </ButtonSecondary>
              <ButtonPrimary href={`/identita/${selected.id}`}>
                Apri scheda →
              </ButtonPrimary>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}