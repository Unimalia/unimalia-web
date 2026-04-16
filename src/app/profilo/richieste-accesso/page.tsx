import Link from "next/link";
import OwnerRequestsClient from "./OwnerRequestsClient";
import { getCoreSystemFlags } from "@/lib/systemFlags";

export const dynamic = "force-dynamic";

export default async function OwnerAccessRequestsPage() {
  const flags = await getCoreSystemFlags();

  if (!flags.owner_access_requests_enabled || flags.emergency_mode || flags.maintenance_mode) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-8 shadow-[0_10px_28px_rgba(42,56,86,0.05)]">
          <h1 className="text-2xl font-semibold tracking-tight text-[#30486f]">
            Richieste accesso non disponibili
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">
            Il flusso richieste accesso owner → professionisti è momentaneamente disattivato dalle
            impostazioni di sistema.
          </p>

          <div className="mt-6">
            <Link
              href="/profilo"
              className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
            >
              Torna al profilo
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <OwnerRequestsClient />
    </main>
  );
}