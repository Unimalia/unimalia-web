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
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Animali in gestione</h1>
          <p className="text-sm text-neutral-600">
            Vedi gli animali con grant attivo e quelli creati direttamente dalla tua struttura
            (nessuna ricerca globale).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/professionisti/scansiona/manuale/nuovo"
            className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
          >
            Nuovo animale
          </Link>

          <Link
            href="/professionisti/scansiona"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Scansiona microchip
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border p-4 text-sm text-neutral-700">
          Nessun animale disponibile al momento (oppure si è verificato un errore nel caricamento).
          Se hai appena ottenuto un accesso o creato un nuovo animale dalla tua struttura, ricarica
          la pagina.
        </div>
      ) : null}

      <ManagedAnimalsClient initialRows={rows} initialQuery={q} />
    </div>
  );
}