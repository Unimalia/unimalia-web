"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "@/_components/ui/page-shell";
import { ButtonPrimary, ButtonSecondary } from "@/_components/ui/button";

export default function AnimalEmergencyPage() {
  const params = useParams<{ id: string }>();
  const animalId = params?.id ?? "";

  return (
    <PageShell
      title="QR emergenza / medaglietta"
      subtitle="Sezione separata dai codici identificativi UNIMALIA."
      backFallbackHref={animalId ? `/identita/${animalId}` : "/identita"}
      actions={
        <>
          <ButtonSecondary href={animalId ? `/identita/${animalId}` : "/identita"}>
            Torna alla scheda animale
          </ButtonSecondary>
          <ButtonPrimary href={animalId ? `/identita/${animalId}` : "/identita"}>
            Chiudi
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">QR emergenza</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Questa area sarà dedicata a un QR separato, da usare solo in caso di emergenza
                o per creare una medaglietta.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                In preparazione
              </p>
              <p className="mt-2 text-sm text-amber-800">
                Il QR emergenza non userà i codici già presenti nella scheda animale e non sarà
                mostrato nella pagina principale per evitare confusione.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Cosa conterrà questa sezione</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Dati visibili</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                Foto, identità e dati di emergenza essenziali
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Configurazione</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                Scelta campi visibili con checkbox
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Codice separato</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                QR dedicato, distinto da QR e barcode UNIMALIA
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Uso previsto</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                Emergenza e medaglietta
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Prossimo step</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Nel prossimo blocco verranno aggiunti i campi selezionabili, la preview del QR
            emergenza e la futura scheda pubblica separata.
          </p>

          <div className="mt-4">
            <Link
              href={animalId ? `/identita/${animalId}` : "/identita"}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Torna alla scheda animale
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}