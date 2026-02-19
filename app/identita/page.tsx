"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

function digitalCode(a: Animal) {
  const chip = normalizeChip(a.chip_number || "");
  if (chip) {
    return {
      kind: "microchip" as const,
      label: "Microchip",
      value: chip,
      helper: a.microchip_verified ? "Verificato ✅" : "In attesa verifica veterinaria 🟡",
    };
  }
  const code = a.unimalia_code?.trim();
  return {
    kind: "unimalia" as const,
    label: "UNIMALIA ID",
    value: code ? `UNIMALIA:${code}` : "UNIMALIA:—",
    helper: "Codice interno per animali senza microchip.",
  };
}

export default function IdentitaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [profileOk, setProfileOk] = useState(true);

  // modal codice digitale
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Animal | null>(null);
  const selectedCode = useMemo(() => (selected ? digitalCode(selected) : null), [selected]);

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

      // carica profilo proprietario (per banner “completa profilo”)
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

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copiato ✅");
    } catch {
      alert("Non riesco a copiare automaticamente. Seleziona e copia manualmente.");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Identità animale</h1>
            <p className="mt-2 text-zinc-700">Caricamento…</p>
          </div>
          <div className="h-10 w-32 rounded-lg bg-zinc-200/60" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl border border-zinc-200 bg-white shadow-sm" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Identità animale</h1>
          <p className="mt-2 max-w-3xl text-zinc-700">
            Qui trovi le identità digitali dei tuoi animali. Apri una scheda per gestire dati, stato e (in futuro) cartella clinica.
          </p>
        </div>

        <Link
          href="/identita/nuovo"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          + Crea profilo
        </Link>
      </div>

      {/* BANNER PROFILO */}
      {!profileOk && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Completa il profilo proprietario</p>
              <p className="mt-1 text-amber-900/80">
                Per usare UNIMALIA in modo completo (e far vedere correttamente i tuoi dati ai professionisti) inserisci i tuoi dati.
              </p>
            </div>
            <Link
              href="/profilo"
              className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100/40"
            >
              Vai al profilo →
            </Link>
          </div>
        </div>
      )}

      {/* ERROR */}
      {err && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700 shadow-sm">
          {err}
        </div>
      )}

      {/* EMPTY */}
      {!err && animals.length === 0 && (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-base font-semibold">Nessun profilo animale</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Crea la prima identità digitale del tuo animale: foto, dati base e (se presente) microchip.
          </p>
          <Link
            href="/identita/nuovo"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            + Crea profilo
          </Link>
        </div>
      )}

      {/* GRID */}
      {animals.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => {
            const st = statusBadge(a.status);
            const code = digitalCode(a);

            return (
              <div
                key={a.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                {/* FOTO */}
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
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* CONTENUTO */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold">{a.name}</h3>
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

                  {/* DETTAGLI “puliti” */}
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

                  {/* CODICE DIGITALE (info compatta) */}
                  <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs font-semibold text-zinc-800">
                      {code.label}:{" "}
                      <span className="font-mono text-[12px]">
                        {code.kind === "microchip" ? code.value : (a.unimalia_code || "—")}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-600">{code.helper}</p>
                  </div>

                  {/* AZIONI */}
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <Link
                      href={`/identita/${a.id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    >
                      Apri
                    </Link>

                    <Link
                      href={`/identita/${a.id}/modifica`}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                    >
                      Modifica
                    </Link>

                    <button
                      type="button"
                      onClick={() => openCode(a)}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                    >
                      Codice
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CODICE DIGITALE */}
      {open && selected && selectedCode && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-zinc-500">Codice digitale</p>
                <h3 className="mt-1 text-xl font-bold">{selected.name}</h3>
                <p className="mt-1 text-sm text-zinc-700">
                  {selected.species}
                  {selected.breed ? ` • ${selected.breed}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">
                Tipo: <span className="font-semibold">{selectedCode.label}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-600">{selectedCode.helper}</p>

              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3">
                <p className="text-xs text-zinc-500">Contenuto</p>
                <p className="mt-1 break-all font-mono text-sm text-zinc-900">
                  {selectedCode.value}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copy(selectedCode.value)}
                  className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Copia codice
                </button>

                <Link
                  href={`/identita/${selected.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Apri scheda →
                </Link>
              </div>

              <p className="mt-4 text-[11px] text-zinc-500">
                Per ora mostriamo il contenuto in modo sicuro. QR/Barcode li riattiviamo dopo i test.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}