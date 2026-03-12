import type { ReactNode } from "react";
import Link from "next/link";
import { hasActiveGrantForAnimal } from "@/lib/professionisti/grants";

export const dynamic = "force-dynamic";

export default async function ClinicaLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ok = await hasActiveGrantForAnimal(id);

  if (!ok) {
    return (
      <div className="mx-auto max-w-4xl p-6 md:p-8">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-6 py-6 md:px-8">
            <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              Accesso protetto
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
              Accesso non autorizzato
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Per visualizzare la cartella clinica serve un{" "}
              <span className="font-semibold text-zinc-900">grant attivo</span>{" "}
              approvato dal proprietario dell’animale.
            </p>
          </div>

          <div className="px-6 py-6 md:px-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-900">
                  Cosa puoi fare adesso
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
                  <li>• Controllare le richieste di accesso già inviate</li>
                  <li>• Inviare una nuova richiesta al proprietario</li>
                  <li>• Tornare alla scansione di un altro animale</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-sm font-semibold text-zinc-900">
                  Motivo più comune
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  Il proprietario non ha ancora approvato l’accesso, oppure il
                  grant precedente è scaduto o revocato.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/professionisti/richieste-accesso"
                className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-900"
              >
                Vai a Richieste accesso
              </Link>

              <Link
                href="/professionisti/scansiona"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Torna a Scansiona
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}