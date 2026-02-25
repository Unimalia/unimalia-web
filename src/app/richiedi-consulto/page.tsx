import { Suspense } from "react";
import RichiediConsultoClient from "./RichiediConsultoClient";

export default function RichiediConsultoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-8 py-8">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="h-7 w-56 rounded bg-zinc-200/70" />
            <div className="mt-3 h-4 w-full max-w-xl rounded bg-zinc-200/50" />
            <div className="mt-1 h-4 w-full max-w-lg rounded bg-zinc-200/40" />
            <div className="mt-6 h-11 w-full rounded-2xl bg-zinc-200/40" />
          </div>
        </div>
      }
    >
      <RichiediConsultoClient />
    </Suspense>
  );
}