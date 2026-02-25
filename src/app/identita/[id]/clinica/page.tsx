"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "@/_components/ui/page-shell";
import { ButtonSecondary, ButtonPrimary } from "@/_components/ui/button";

export default function AnimalClinicalPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return (
    <PageShell
      title="Cartella clinica"
      subtitle="Referti, vaccinazioni, terapie, note."
      backFallbackHref={id ? `/identita/${id}` : "/identita"}
      actions={
        <>
          <ButtonSecondary href={id ? `/identita/${id}` : "/identita"}>
            Torna alla scheda
          </ButtonSecondary>
          <ButtonPrimary href="/professionisti/richieste">
            Richieste consulto
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Timeline</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Qui verranno mostrati eventi clinici in ordine (visite, referti, vaccinazioni).
          </p>

          <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600">
            Nessun dato ancora. Struttura pronta per collegamento dati reali.
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Azioni</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/professionisti/richieste"
              className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
            >
              Condividi con professionista (link temporaneo)
            </Link>

            <span className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-400">
              Aggiungi referto (poi)
            </span>

            <span className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-400">
              Aggiungi vaccinazione (poi)
            </span>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Nota: qui non tocchiamo Supabase/API. Solo UI pronta.
          </p>
        </section>
      </div>
    </PageShell>
  );
}