import Link from "next/link";
import NuovoSmarrimentoClient from "./NuovoSmarrimentoClient";
import { getCoreSystemFlags } from "@/lib/systemFlags";

export const dynamic = "force-dynamic";

export default async function NuovoSmarrimentoPage() {
  const flags = await getCoreSystemFlags();

  if (!flags.lost_found_enabled || flags.emergency_mode || flags.maintenance_mode) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Funzione temporaneamente non disponibile</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            La pubblicazione di nuovi annunci di smarrimento Ã¨ momentaneamente disattivata dalle impostazioni di sistema.
          </p>
          <div className="mt-6">
            <Link
              href="/smarrimenti"
              className="inline-flex rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Torna agli smarrimenti
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <NuovoSmarrimentoClient />;
}
