import Link from "next/link";
import NuovoProfessionistaClient from "./NuovoProfessionistaClient";
import { getCoreSystemFlags } from "@/lib/systemFlags";

export const dynamic = "force-dynamic";

export default async function NuovoProfessionistaPage() {
  const flags = await getCoreSystemFlags();

  if (!flags.professional_registration_enabled || flags.emergency_mode || flags.maintenance_mode) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Registrazione professionisti non disponibile</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            La creazione di nuove schede professionista Ã¨ temporaneamente disattivata dalle impostazioni di sistema.
          </p>
          <div className="mt-6">
            <Link
              href="/professionisti"
              className="inline-flex rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Torna al portale professionisti
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <NuovoProfessionistaClient />;
}
