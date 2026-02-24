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
  status: string;
  premium_active: boolean;
  premium_expires_at: string | null;
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

export default function ProAnimalProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);

  // QR + BARCODE
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;

      setLoading(true);
      setError(null);

      // qui assumiamo che /professionisti abbia già il layout guard (role=pro)
      const { data, error } = await supabase
        .from("animals")
        .select(
          "id,owner_id,created_at,name,species,breed,color,size,chip_number,microchip_verified,status,premium_active,premium_expires_at"
        )
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error || !data) {
        setError("Profilo non trovato o non disponibile.");
        setAnimal(null);
        setLoading(false);
        return;
      }

      setAnimal(data as Animal);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  // QR/Barcode se microchip presente
  useEffect(() => {
    async function buildCodes() {
      setQrDataUrl(null);
      if (!animal?.chip_number) return;

      const chip = normalizeChip(animal.chip_number);
      if (!chip) return;

      const qrPayload = chip;

      try {
        const url = await QRCode.toDataURL(qrPayload, {
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
          JsBarcode(barcodeSvgRef.current, chip, {
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
  }, [animal?.chip_number]);

  const premiumOk = useMemo(() => {
    if (!animal) return false;
    if (!animal.premium_active) return false;
    if (!animal.premium_expires_at) return true;
    return new Date(animal.premium_expires_at).getTime() > Date.now();
  }, [animal]);

  if (loading) {
    return (
      <main className="max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">Profilo animale</h1>
        <p className="mt-4 text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  if (error || !animal) {
    return (
      <main className="max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Profilo animale</h1>
          <Link href="/professionisti" className="text-sm text-zinc-600 hover:underline">
            ← Portale
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {error || "Errore."}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{animal.name}</h1>

          <p className="mt-2 text-zinc-700">
            {animal.species}
            {animal.breed ? ` • ${animal.breed}` : ""}
            {" • "}
            {statusLabel(animal.status)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            Creato il {new Date(animal.created_at).toLocaleDateString("it-IT")} • Owner:{" "}
            <span className="font-mono">{animal.owner_id}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/professionisti")}
            className="text-sm text-zinc-600 hover:underline"
          >
            ← Portale
          </button>

          <Link
            href="/professionisti/scansiona"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Apri scanner
          </Link>
        </div>
      </div>

      {/* GRID */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
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
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Stato profilo</h2>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-700">
              Profilo completo:{" "}
              <span className="font-medium">{premiumOk ? "attivo ✅" : "limitato"}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Questo è l’ambiente professionisti: qui in futuro verrà gestita la vita clinica e
              servizi dell’animale.
            </p>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold">Microchip</h3>
            <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-700">
                {animal.chip_number ? "Microchip presente ✔️" : "Microchip assente"}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {animal.chip_number
                  ? animal.microchip_verified
                    ? "Verificato ✅"
                    : "Non verificato (per ora)."
                  : "Non disponibile."}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* CODICI */}
      <div className="mt-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Codici identificativi (professionisti)</h2>
          <p className="mt-2 text-sm text-zinc-700">
            QR e barcode codificano il numero microchip.
          </p>

          {!animal.chip_number ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              Nessun microchip presente per generare i codici.
            </div>
          ) : (
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-semibold">Barcode (CODE128)</p>
                <div className="mt-3 overflow-x-auto">
                  <svg ref={barcodeSvgRef} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">Contenuto: microchip</p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-semibold">QR code</p>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR microchip"
                    className="mt-3 h-44 w-44 rounded-lg border border-zinc-200 bg-white object-contain"
                  />
                ) : (
                  <div className="mt-3 h-44 w-44 rounded-lg border border-zinc-200 bg-zinc-50" />
                )}
                <p className="mt-2 text-xs text-zinc-500">Contenuto: microchip</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* REPORT VITA ANIMALE (placeholder) */}
      <div className="mt-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Report vita animale (in costruzione)</h2>
          <p className="mt-3 text-sm text-zinc-700">
            Qui comparirà la timeline completa: visite, vaccini, esami, diete, pensioni, ecc.
          </p>
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Nessun evento registrato.
          </div>
        </section>
      </div>
    </main>
  );
}
