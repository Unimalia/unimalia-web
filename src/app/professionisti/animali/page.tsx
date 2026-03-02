// src/app/professionisti/animali/page.tsx
import { getManagedAnimals } from "@/lib/professionisti/getManagedAnimals";
import ManagedAnimalsClient from "./ManagedAnimalsClient";

export const dynamic = "force-dynamic"; // evita cache lato server in questa fase

export default async function ProfessionistiAnimaliPage() {
  const rows = await getManagedAnimals();

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Animali in gestione</h1>
        <p className="text-sm text-neutral-600">
          Vedi solo gli animali con grant attivo per la tua struttura. Nessuna ricerca globale.
        </p>
      </div>

      <ManagedAnimalsClient initialRows={rows} />
    </div>
  );
}