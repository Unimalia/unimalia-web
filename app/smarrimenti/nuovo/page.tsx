import { Suspense } from "react";
import NuovoSmarrimentoClient from "./NuovoSmarrimentoClient";

import { PageShell } from "@/_components/ui/page-shell";
import { ButtonPrimary, ButtonSecondary } from "@/_components/ui/button";

export default function Page() {
  return (
    <Suspense
      fallback={
        <PageShell
          title="Nuovo smarrimento"
          subtitle="Caricamento…"
          backFallbackHref="/smarrimenti"
          actions={
            <>
              <ButtonSecondary href="/miei-annunci">I miei annunci</ButtonSecondary>
              <ButtonPrimary href="/smarrimenti">Smarrimenti</ButtonPrimary>
            </>
          }
        >
          <div className="text-sm text-zinc-600">Sto caricando il modulo…</div>
        </PageShell>
      }
    >
      <NuovoSmarrimentoClient />
    </Suspense>
  );
}