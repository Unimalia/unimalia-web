"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { PageShell } from "@/_components/ui/page-shell";
import { Card } from "@/_components/ui/card";
import { ButtonPrimary, ButtonSecondary } from "@/_components/ui/button";
import { AnimalCodes } from "@/_components/animal/animal-codes";
import { getBarcodeValue, getQrValue } from "@/lib/animalCodes";

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
  phone: string | null;
  phone_verified?: boolean | null;
  city: string | null;
};

function normalizeCF(s: string) {
  return (s || "").replace(/\s+/g, "").trim().toUpperCase();
}

function normalizePhone(input: string) {
  const raw = (input || "").replace(/\s+/g, "").trim();
  if (!raw) return "";
  return raw.startsWith("+") ? raw : `+39${raw}`;
}

function isLikelyFullName(s: string) {
  const v = (s || "").trim();
  if (v.length < 5) return false;
  const parts = v.split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

const REQUIRE_PHONE_VERIFIED = false;

function isProfileComplete(p: OwnerProfile | null) {
  if (!p) return false;

  const fullNameOk = isLikelyFullName(p.full_name ?? "");
  const phoneOk = normalizePhone(p.phone ?? "").length >= 8;
  const cityOk = (p.city ?? "").trim().length >= 2;

  const cf = normalizeCF(p.fiscal_code ?? "");
  const cfOk = !cf || cf.length === 16;

  if (!fullNameOk || !phoneOk || !cityOk || !cfOk) return false;

  if (!REQUIRE_PHONE_VERIFIED) return true;

  return p.phone_verified === true;
}

function statusBadge(status: string) {
  switch (status) {
    case "deleted":
      return { label: "Archiviato", cls: "border-zinc-200 bg-zinc-100 text-zinc-700" };
    case "lost":
      return { label: "Smarrito", cls: "border-red-200 bg-red-50 text-red-700" };
    case "found":
      return { label: "Ritrovato", cls: "border-sky-200 bg-sky-50 text-sky-700" };
    case "home":
    case "safe":
    default:
      return { label: "A casa", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function IdentitaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [profileOk, setProfileOk] = useState(true);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Animal | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const qrValue = useMemo(() => {
    if (!selected) return "";
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://unimalia.it";
    return getQrValue(selected, origin);
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
        .select("full_name,fiscal_code,phone,phone_verified,city")
        .eq("id", user.id)
        .maybeSingle();

      if (!alive) return;

      const profile = (pData as OwnerProfile | null) ?? null;
      setProfileOk(isProfileComplete(profile));

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

      const list = ((data as Animal[]) || []).filter(
        (a) => (a.status || "").toLowerCase() !== "deleted"
      );

      setAnimals(list);
      setLoading(false);
    }

    void load();
    return () => {
      alive = false;
    };
  }, [router]);

  function openCode(a: Animal) {
    setSelected(a);
    setOpen(true);
  }

  async function deleteAnimal(a: Animal) {
    setDeleteErr(null);

    const ok = window.confirm(`Vuoi archiviare "${a.name}"?\n\nPotrai ripristinarlo in futuro.`);
    if (!ok) return;

    setDeletingId(a.id);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        router.replace("/login?next=/identita");
        return;
      }

      const { error } = await supabase
        .from("animals")
        .update({ status: "deleted" })
        .eq("id", a.id)
        .eq("owner_id", user.id);

      if (error) {
        console.error("DELETE ANIMAL ERROR:", error);
        setDeleteErr(error.message);
        return;
      }

      setAnimals((prev) => prev.filter((x) => x.id !== a.id));
    } catch (error: unknown) {
      console.error("DELETE ANIMAL EXCEPTION:", error);
      setDeleteErr(getErrorMessage(error, "Errore durante l’eliminazione. Riprova."));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <PageShell
        title="Identità animale"
        subtitle="Caricamento…"
        backFallbackHref="/"
        boxed
        actions={<div className="h-10 w-36 rounded-full bg-zinc-200/70" />}
      >
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_14px_40px_rgba(42,56,86,0.06)]"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Identità animale"
      subtitle="Le schede dei tuoi animali. Apri una scheda per gestire dati, codici e stato."
      backFallbackHref="/"
      boxed={false}
      actions={<ButtonPrimary href="/identita/nuovo">+ Crea profilo</ButtonPrimary>}
    >
      {!profileOk ? (
        <div className="mb-6">
          <Card>
            <div className="rounded-[2rem] border border-amber-200 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] p-6 text-sm text-amber-900 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                    Profilo incompleto
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-zinc-900">
                    Completa il profilo proprietario
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
                    Inserisci nome e cognome, telefono e città per creare un’identità animale e
                    usare tutte le funzioni in modo corretto.
                  </p>
                </div>
                <ButtonSecondary href="/profilo?returnTo=/identita">
                  Vai al profilo →
                </ButtonSecondary>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {err ? (
        <div className="mb-6">
          <Card>
            <div className="rounded-[2rem] border border-red-200 bg-white p-5 text-sm text-red-700 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
              {err}
            </div>
          </Card>
        </div>
      ) : null}

      {deleteErr ? (
        <div className="mb-6">
          <Card>
            <div className="rounded-[2rem] border border-red-200 bg-white p-5 text-sm text-red-700 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
              {deleteErr}
            </div>
          </Card>
        </div>
      ) : null}

      <div className="mb-6">
        <Card>
          <div className="rounded-[2rem] border border-teal-200 bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_52%,#fff7ed_100%)] p-6 shadow-[0_18px_45px_rgba(42,56,86,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">
                  UNIMALIA Premium
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-zinc-900">
                  Il controllo completo della vita del tuo animale, a un prezzo minimo
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-700">
                  Cartella clinica organizzata, storico sempre accessibile, promemoria,
                  funzioni avanzate e più ordine in un unico posto.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                  <span className="font-semibold text-zinc-900">Solo 6€ all’anno</span>,
                  meno di <span className="font-semibold text-zinc-900">0,50€ al mese</span>.
                  Un piccolo contributo per avere molto di più e aiutare UNIMALIA a crescere
                  e migliorare nel tempo.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <ButtonPrimary href="/prezzi">Scopri Premium</ButtonPrimary>
                <p className="text-xs text-zinc-500">Piano annuale semplice e trasparente</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {!err && animals.length === 0 ? (
        <Card>
          <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-8 shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
              Nessun profilo animale
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">
              Crea la prima identità digitale del tuo animale per iniziare a raccogliere dati,
              codici e storico in un unico posto.
            </p>
            <div className="mt-6">
              <ButtonPrimary href="/identita/nuovo">+ Crea profilo</ButtonPrimary>
            </div>
          </div>
        </Card>
      ) : null}

      {animals.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {animals.map((a) => {
            const st = statusBadge(a.status);
            const imgSrc = imageErrors[a.id]
              ? "/placeholder-animal.jpg"
              : a.photo_url || "/placeholder-animal.jpg";

            return (
              <div
                key={a.id}
                className="overflow-hidden rounded-[2rem] border border-[#e3e9f0] bg-white shadow-[0_14px_40px_rgba(42,56,86,0.06)]"
              >
                <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)] p-3">
                  <div className="relative overflow-hidden rounded-[1.3rem] border border-[#e5ebf1] bg-white">
                    <div className="relative h-48 w-full">
                      <Image
                        src={imgSrc}
                        alt={a.name}
                        fill
                        className="object-contain"
                        unoptimized
                        onError={() => {
                          setImageErrors((prev) => ({ ...prev, [a.id]: true }));
                        }}
                      />
                    </div>

                    <div className="absolute left-3 top-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold tracking-[-0.02em] text-[#30486f]">
                        {a.name}
                      </h2>
                      <p className="mt-1 text-sm text-[#5f708a]">
                        {a.species}
                        {a.breed ? ` • ${a.breed}` : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                        Creato
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#5f708a]">
                        {new Date(a.created_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fbff] px-3 py-2">
                      <span className="text-[#6f7d91]">Colore</span>
                      <span className="font-medium text-zinc-900">{a.color || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fbff] px-3 py-2">
                      <span className="text-[#6f7d91]">Taglia</span>
                      <span className="font-medium text-zinc-900">{a.size || "—"}</span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <ButtonPrimary href={`/identita/${a.id}`}>Apri</ButtonPrimary>
                    <ButtonSecondary href={`/identita/${a.id}/modifica`}>
                      Modifica
                    </ButtonSecondary>

                    <button
                      type="button"
                      onClick={() => openCode(a)}
                      className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-4 py-2.5 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
                    >
                      Codice
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteAnimal(a)}
                      disabled={deletingId === a.id}
                      className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === a.id ? "Elimino…" : "Elimina"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-8">
        <Card>
          <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-6 text-sm shadow-[0_14px_40px_rgba(42,56,86,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
              Funzioni avanzate
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#30486f]">
              Cartella clinica e strumenti evoluti
            </h2>

            <p className="mt-4 leading-relaxed text-[#5f708a]">
              Gli smarrimenti su UNIMALIA sono sempre gratuiti e puoi pubblicarli anche senza
              registrazione.
            </p>

            <p className="mt-2 leading-relaxed text-[#5f708a]">
              Creare un account ti permette anche di gestire l’identità animale e accedere alle
              funzioni complete della piattaforma.
            </p>

            <p className="mt-2 leading-relaxed text-[#5f708a]">
              Anche nella versione gratuita è disponibile una cartella clinica rapida con i dati
              essenziali del tuo animale.
            </p>

            <p className="mt-2 leading-relaxed text-[#5f708a]">
              Con Premium hai una gestione completa: timeline clinica, archivio organizzato,
              promemoria e storico sempre accessibile.
            </p>

            <p className="mt-5 font-semibold text-zinc-900">
              Invita il tuo veterinario nella Rete UNIMALIA
            </p>

            <p className="mt-2 leading-relaxed text-[#5f708a]">
              I dati possono essere inseriti direttamente dal veterinario, così da avere
              informazioni affidabili e aggiornate.
            </p>

            <p className="mt-2 leading-relaxed text-[#5f708a]">
              Se non utilizza ancora la piattaforma, può contattarci per maggiori informazioni:
              <br />
              <span className="font-medium text-zinc-900">professionisti@unimalia.it</span>
            </p>
          </div>
        </Card>
      </div>

      {open && selected ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-[2rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_24px_80px_rgba(42,56,86,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                  Codici
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#30486f]">
                  {selected.name}
                </h2>
                <p className="mt-1 text-sm text-[#5f708a]">
                  {selected.species}
                  {selected.breed ? ` • ${selected.breed}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#d7dfe9] bg-white px-4 py-2 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-6">
              <AnimalCodes
                qrValue={qrValue}
                barcodeValue={getBarcodeValue(selected)}
                caption="Stampa o mostra rapidamente in caso di necessità."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonSecondary href={qrValue}>Pagina scansione →</ButtonSecondary>
              <ButtonPrimary href={`/identita/${selected.id}`}>Apri scheda →</ButtonPrimary>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}