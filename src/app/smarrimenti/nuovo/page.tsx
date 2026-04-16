import Link from "next/link";
import NuovoSmarrimentoClient from "./NuovoSmarrimentoClient";
import { getCoreSystemFlags } from "@/lib/systemFlags";

export const dynamic = "force-dynamic";

export default async function NuovoSmarrimentoPage() {
  const flags = await getCoreSystemFlags();

  if (!flags.lost_found_enabled || flags.emergency_mode || flags.maintenance_mode) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
        <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Smarrimenti UNIMALIA
              </span>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#30486f] sm:text-4xl">
                Funzione temporaneamente non disponibile
              </h1>

              <p className="mt-4 text-sm leading-7 text-[#55657d] sm:text-base">
                La pubblicazione di nuovi annunci di smarrimento è momentaneamente disattivata dalle
                impostazioni di sistema.
              </p>

              <div className="mt-8">
                <Link
                  href="/smarrimenti"
                  className="inline-flex rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Torna agli smarrimenti
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <NuovoSmarrimentoClient />;
}