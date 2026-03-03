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
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Accesso non autorizzato</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Serve un grant attivo approvato dall’owner per vedere la cartella clinica.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/professionisti/richieste-accesso"
            className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            Vai a Richieste accesso
          </Link>
          <Link
            href="/professionisti/scansiona"
            className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            Torna a Scansiona
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}