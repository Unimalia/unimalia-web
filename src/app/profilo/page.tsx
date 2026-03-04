export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ProfiloClient } from "./profilo-client";

export default function ProfiloPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-700">Caricamento…</div>}>
      <ProfiloClient />
    </Suspense>
  );
}