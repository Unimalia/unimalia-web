import { Suspense } from "react";
import NuovoSmarrimentoClient from "./NuovoSmarrimentoClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 sm:px-8">Caricamento…</div>}>
      <NuovoSmarrimentoClient />
    </Suspense>
  );
}