import { PageShell } from "@/_components/ui/page-shell";
import { AdottaClient } from "./_components/adotta-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Adozioni | UNIMALIA",
  description:
    "Area adozioni UNIMALIA: spazio dedicato alle associazioni per pubblicare animali adottabili in modo ordinato, con identità animale digitale e ricerca tramite filtri.",
};

export default function Page() {
  return (
    <PageShell
      title="Adozioni"
      subtitle="Uno spazio dedicato alle associazioni per pubblicare animali adottabili in modo più chiaro, consultabile e coerente con l’identità digitale UNIMALIA."
      boxed
      actions={null}
    >
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2.2rem] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_40px_rgba(42,56,86,0.06)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
            Area adozioni
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#30486f] sm:text-3xl">
            Più ordine tra pubblicazione, consultazione e continuità futura
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#5f708a] sm:text-base">
            Questa sezione è pensata per aiutare le associazioni a presentare gli animali in
            adozione in modo più chiaro, leggibile e coerente. L’obiettivo non è solo pubblicare un
            annuncio, ma creare una base più solida che possa accompagnare l’animale anche dopo il
            passaggio alla nuova famiglia.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_10px_24px_rgba(42,56,86,0.05)]">
              <p className="text-sm font-semibold text-[#30486f]">Per le associazioni</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                Uno spazio più serio e ordinato per pubblicare gli animali adottabili.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_10px_24px_rgba(42,56,86,0.05)]">
              <p className="text-sm font-semibold text-[#30486f]">Per chi cerca</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                Filtri più chiari, schede più leggibili e consultazione più semplice.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e3e9f0] bg-white p-5 shadow-[0_10px_24px_rgba(42,56,86,0.05)]">
              <p className="text-sm font-semibold text-[#30486f]">Per il futuro</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5f708a]">
                Più continuità tra annuncio, identità animale e percorso successivo dell’animale.
              </p>
            </div>
          </div>
        </section>

        <AdottaClient />
      </div>
    </PageShell>
  );
}