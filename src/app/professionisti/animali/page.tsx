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
  const rows = await getManagedAnimals(q);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Animali in gestione</h1>
        <p className="text-sm text-neutral-600">
          Vedi solo animali con grant attivo (nessuna ricerca globale).
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border p-4 text-sm text-neutral-700">
          Nessun animale autorizzato al momento. Se hai appena ottenuto un accesso, ricarica la pagina.
        </div>
      ) : null}

      <ManagedAnimalsClient initialRows={rows} initialQuery={q} />
    </div>
  );
}