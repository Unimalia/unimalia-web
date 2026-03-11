// src/app/professionisti/animali/page.tsx
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
    // Log server-side (visibile nei log del deploy)
    console.error("[professionisti/animali] getManagedAnimals failed", e);
    rows = [];
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Animali in gestione</h1>
        <p className="text-sm text-neutral-600">
          Vedi gli animali con grant attivo e quelli creati direttamente dalla tua struttura (nessuna ricerca globale).
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border p-4 text-sm text-neutral-700">
          Nessun animale disponibile al momento (oppure si è verificato un errore nel caricamento).
          Se hai appena ottenuto un accesso o creato un nuovo animale dalla tua struttura, ricarica la pagina.
        </div>
      ) : null}

      <ManagedAnimalsClient initialRows={rows} initialQuery={q} />
    </div>
  );
}