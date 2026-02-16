"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

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
  status: string; // home | lost | found (o safe legacy)
  premium_active: boolean;
  premium_expires_at: string | null;

  unimalia_code: string; // uuid
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

function normalizeChip(raw: string) {
  return raw.replace(/\s+/g, "").trim();
}

export default function AnimalProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);

  // QR + BARCODE owner-only
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;

      setLoading(true);
      setError(null);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const user = authData.user;

      if (authErr || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("animals")
        .select(
          "id,owner_id,created_at,name,species,breed,color,size,chip_number,microchip_verified,status,premium_active,premium_expires_at,unimalia_code"
        )
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error || !data) {
        setError(error?.message || "Profilo non trovato.");
        setAnimal(null);
        setLoading(false);
        return;
      }

      const a = data as Animal;

      // sicurezza extra (RLS dovrebbe già bloccare, ma meglio)
      if (a.owner_id !== user.id) {
        router.replace("/identita");
        return;
      }

      setAnimal(a);
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

  // Regola: codice digitale = microchip se presente, altrimenti UNIMALIA ID
  const digitalCode = useMemo(() => {
    if (!animal) return null;

    if (animal.chip_number && normalizeChip(animal.chip_number)) {
      return {
        label: "Microchip",
        value: normalizeChip(animal.chip_number),
        note: "Questo è il codice digitale definitivo dell’animale.",
      };
    }

    return {
      label: "UNIMALIA ID",
      value: `UNIMALIA:${animal.unimalia_code}`,
      note: "Codice digitale per animali senza microchip.",
    };
  }, [animal]);

  // genera QR/Barcode (solo per owner)
  useEffect(() => {
    async function buildCodes() {
      setQrDataUrl(null);

      if (!digitalCode?.value) return;

      try {
        const url = await QRCode.toDataURL(digitalCode.value, {
          errorCorrectionLevel: "M",
          margin: 2,
          scale: 8,
        });
        setQrDataUrl(url);
      } catch {
        setQrDataUrl(null);
      }

      try {
        if (barcodeSvgRef.current) {
          JsBarcode(barcodeSvgRef.current, digitalCode.value, {
            format: "CODE128",
            displayValue: true,
            lineColor: "#111827",
            width: 2,
            height: 60,
            margin: 10,
            fontSize: 14,
          });
        }
      } catch {}
    }

    buildCodes();
  }, [digitalCode]);

  if (loading) {
    return (
      <main className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Profilo animale</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  if (error || !animal) {
    return (
      <main className="max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Profilo animale</h1>
          <Link href="/identita" className="text-sm text-zinc-600 hover:underline">
            ← Torna
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error || "Errore."}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{animal.name}</h1>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-zinc-700">
              {animal.species}
              {animal.breed ? ` • ${animal.breed}` : ""}
              {" • "}
              {statusLabel(animal.status)}
            </p>

            <Link
              href={`/smarrimenti/nuovo?animal_id=${animal.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              title="Crea un annuncio collegato a questo profilo"
            >
              Segnala smarrimento
            </Link>
          </div>
        </div>

        <Link href="/identita" className="text-sm text-zinc-600 hover:underline">
          ← Torna
        </Link>
      </div>

      {/* SEZIONI */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Identità</h2>

          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Nome</dt>
              <dd className="font-medium">{animal.name}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Tipo</dt>
              <dd className="font-medium">{animal.species}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Razza</dt>
              <dd className="font-medium">{animal.breed || "—"}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Colore / segni</dt>
              <dd className="font-medium">{animal.color || "—"}</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Taglia</dt>
              <dd className="font-medium">{animal.size || "—"}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-zinc-500">
            Creato il {new Date(animal.created_at).toLocaleDateString("it-IT")}
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Stato profilo</h2>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-700">
              Profilo completo:{" "}
              <span className="font-medium">{premiumOk ? "attualmente gratuito ✅" : "limitato"}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Smarrimenti sempre gratuiti. In futuro alcune funzioni potrebbero richiedere UNIMALIA ID per sostenere il progetto.
            </p>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold">Microchip</h3>
            <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-700">
                {animal.chip_number ? "Microchip inserito ✔️" : "Microchip non presente"}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {animal.chip_number
                  ? animal.microchip_verified
                    ? "Verificato da veterinario ✅"
                    : "Non verificato (verifica disponibile tramite veterinario)."
                  : "Se il tuo animale non ha microchip, viene identificato tramite UNIMALIA ID."}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* CODICI DIGITALI (OWNER ONLY) */}
      <div className="mt-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Codice digitale</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Barcode e QR sono visibili solo a te. Servono per far aprire velocemente la scheda ai professionisti autorizzati.
          </p>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-800">
              Tipo: <span className="font-semibold">{digitalCode?.label}</span>
            </p>
            <p className="mt-1 text-xs text-zinc-600">{digitalCode?.note}</p>
          </div>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold">Barcode (CODE128)</p>
              <div className="mt-3 overflow-x-auto">
                <svg ref={barcodeSvgRef} />
              </div>
              <p className="mt-2 text-xs text-zinc-500">Contenuto: {digitalCode?.label}</p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold">QR code</p>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR codice digitale"
                  className="mt-3 h-44 w-44 rounded-lg border border-zinc-200 bg-white object-contain"
                />
              ) : (
                <div className="mt-3 h-44 w-44 rounded-lg border border-zinc-200 bg-zinc-50" />
              )}
              <p className="mt-2 text-xs text-zinc-500">Contenuto: {digitalCode?.label}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Cartella clinica ghost (owner) */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Cartella clinica (in arrivo)</h2>
          <p className="mt-3 text-sm text-zinc-700">
            Questa sezione sarà compilabile dal veterinario di fiducia tramite accesso professionale dedicato.
          </p>
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Nessuna informazione registrata.
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Condivisione (in arrivo)</h2>
          <p className="mt-3 text-sm text-zinc-700">
            In futuro potrai dare accesso temporaneo ai professionisti e condividere un link controllato.
          </p>
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Link pubblico: disponibile prossimamente.
          </div>
        </section>
      </div>
    </main>
  );
}
