import Link from "next/link";
import { getManagedAnimals } from "@/lib/professionisti/getManagedAnimals";
import ManagedAnimalsClient from "./ManagedAnimalsClient.client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfessionistiAnimaliPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = (resolvedSearchParams?.q || "").trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f6f9fc_100%)]">
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="rounded-[2rem] border border-red-200 bg-white p-6 shadow-[0_24px_60px_rgba(42,56,86,0.08)]">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Sessione non valida
            </h1>
            <p className="mt-3 text-sm leading-7 text-red-700">
              Effettua di nuovo il login come professionista per visualizzare gli animali gestiti.
            </p>
          </div>
        </section>
      </main>
    );
  }

  let rows: Awaited<ReturnType<typeof getManagedAnimals>> = [];

  try {
    rows = await getManagedAnimals(user.id);
  } catch (e) {
    console.error("[professionisti/animali] getManagedAnimals failed", e);
    rows = [];
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.08)]">
          <div className="border-b border-[#e3e9f0] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d91]">
                  Area professionisti
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl">
                  Animali gestiti
                </h1>

                <p className="mt-4 text-sm leading-7 text-[#5f708a] sm:text-base">
                  Qui trovi sia gli animali con grant attivo sia quelli creati o originati dalla tua
                  clinica. Questa è la vista operativa principale per aprire velocemente la scheda
                  corretta e continuare il lavoro.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/professionisti/scansiona/manuale/nuovo"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Nuovo animale
                </Link>

                <Link
                  href="/professionisti/scansiona/manuale"
                  className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                >
                  Scansiona microchip
                </Link>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-[#f8fbff] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                  Vista operativa
                </div>
                <div className="mt-2 text-sm font-semibold text-[#30486f]">
                  Animali con grant attivo
                </div>
                <p className="mt-2 text-sm leading-6 text-[#5f708a]">
                  Comprende gli animali su cui la tua struttura è autorizzata a lavorare.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                  Origine clinica
                </div>
                <div className="mt-2 text-sm font-semibold text-[#30486f]">
                  Schede create dalla clinica
                </div>
                <p className="mt-2 text-sm leading-6 text-[#5f708a]">
                  Include anche le schede nate direttamente dal tuo flusso professionale.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f7d91]">
                  Accesso rapido
                </div>
                <div className="mt-2 text-sm font-semibold text-[#30486f]">
                  Ricerca e apertura scheda
                </div>
                <p className="mt-2 text-sm leading-6 text-[#5f708a]">
                  Cerca, filtra e apri subito la scheda animale corretta dal blocco qui sotto.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-4 shadow-sm sm:p-5">
              <ManagedAnimalsClient initialRows={rows} initialQuery={q} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}