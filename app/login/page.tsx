export const dynamic = "force-dynamic";

import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">Login</h1>
          <p className="mt-4 text-zinc-700">Caricamento…</p>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
