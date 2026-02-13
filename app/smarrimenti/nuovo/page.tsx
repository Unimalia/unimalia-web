import { Suspense } from "react";
import NuovoSmarrimentoClient from "./NuovoSmarrimentoClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Pubblica smarrimento</h1>
          <p className="mt-4 text-zinc-700">Caricamento…</p>
        </main>
      }
    >
      <NuovoSmarrimentoClient />
    </Suspense>
  );
}
