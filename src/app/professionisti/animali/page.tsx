// src/app/professionisti/animali/page.tsx
import Link from "next/link";
import { getManagedAnimals } from "@/lib/professionisti/getManagedAnimals";
import ManagedAnimalsClient from "./ManagedAnimalsClient.client";

export const dynamic = "force-dynamic";

export default async function ProfessionistiAnimaliPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams?.q || "").trim();

  let rows: Awaited<ReturnType<typeof getManagedAnimals>> = [];
  try {
    rows = await getManagedAnimals(q);
  } catch (e) {
    console.error("[professionisti/animali] getManagedAnimals failed", e);
    rows = [];
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Animali gestiti</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Qui vedi sia gli animali con grant attivo sia quelli creati o originati dalla tua clinica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/professionisti/scansiona/manuale/nuovo"
            className="rounded-xl border px-4 py-2"
          >
            Nuovo animale
          </Link>

          <Link
            href="/professionisti/scansiona/manuale"
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            Scansiona microchip
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-2xl border p-4 text-sm text-neutral-700">
          Nessun animale disponibile al momento (oppure si è verificato un errore nel caricamento).
          Se hai appena ottenuto un accesso o creato un nuovo animale dalla tua struttura, ricarica
          la pagina.
        </div>
      ) : null}

      <ManagedAnimalsClient initialRows={rows} initialQuery={q} />
    </div>
  );
}