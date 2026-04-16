import Link from "next/link";
import OwnerRequestsClient from "./OwnerRequestsClient";
import { getCoreSystemFlags } from "@/lib/systemFlags";

export const dynamic = "force-dynamic";

export default async function OwnerAccessRequestsPage() {
  const flags = await getCoreSystemFlags();

  if (!flags.owner_access_requests_enabled || flags.emergency_mode || flags.maintenance_mode) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Richieste accesso non disponibili</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Il flusso richieste accesso owner â†’ professionisti Ã¨ momentaneamente disattivato dalle impostazioni di sistema.
          </p>
          <div className="mt-6">
            <Link
              href="/profilo"
              className="inline-flex rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Torna al profilo
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <OwnerRequestsClient />;
}
