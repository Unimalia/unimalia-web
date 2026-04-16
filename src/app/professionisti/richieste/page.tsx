import Link from "next/link";
import ProfessionistiRichiesteClient from "./ProfessionistiRichiesteClient";
import { getCoreSystemFlags } from "@/lib/systemFlags";

export const dynamic = "force-dynamic";

export default async function ProfessionistiRichiestePage() {
  const flags = await getCoreSystemFlags();

  if (!flags.consults_enabled || flags.emergency_mode || flags.maintenance_mode) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Consulti temporaneamente non disponibili</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Il modulo consulti tra professionisti Ã¨ momentaneamente disattivato dalle impostazioni di sistema.
          </p>
          <div className="mt-6">
            <Link
              href="/professionisti/dashboard"
              className="inline-flex rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Torna alla dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <ProfessionistiRichiesteClient />;
}
