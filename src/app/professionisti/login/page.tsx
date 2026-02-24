export const dynamic = "force-dynamic";

import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function ProLoginPage() {
  return (
    <Suspense fallback={<div className="p-6">Caricamento…</div>}>
      <LoginClient />
    </Suspense>
  );
}
