"use client";

import Link from "next/link";
import Script from "next/script";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-[#5f708a]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition hover:text-[#30486f]">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#30486f]">Privacy</li>
          </ol>
        </nav>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <header className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Informazioni legali
              </span>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
                Privacy Policy
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[#55657d] sm:text-lg">
                La Privacy Policy di UNIMALIA è disponibile tramite Iubenda e raccoglie le
                informazioni relative al trattamento dei dati personali, alle finalità del servizio
                e ai diritti dell’utente.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/termini"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Vai ai Termini e condizioni
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Torna alla home
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dbe5ef] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8 lg:p-10">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Trasparenza e dati
              </span>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Chiarezza su come vengono trattati i dati personali
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
                UNIMALIA considera la protezione dei dati un elemento centrale del progetto. Per
                questo la documentazione privacy è disponibile in forma dedicata e consultabile
                direttamente online.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Documento dedicato</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    La Privacy Policy è pubblicata tramite Iubenda in una forma strutturata e sempre
                    consultabile.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Trattamento dei dati</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    La policy descrive finalità, basi giuridiche, modalità di trattamento e diritti
                    degli interessati.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Consultazione immediata</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Puoi aprire e leggere la documentazione privacy direttamente da questa pagina.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-10 rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Documento ufficiale
              </span>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                Consulta la Privacy Policy completa
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#55657d] sm:text-base">
                La Privacy Policy è gestita tramite Iubenda. Apri il documento completo per leggere
                tutti i dettagli relativi al trattamento dei dati personali all’interno dei servizi
                UNIMALIA.
              </p>

              <div className="mt-6 rounded-[22px] border border-[#dbe5ef] bg-white px-5 py-4">
                <a
                  href="https://www.iubenda.com/privacy-policy/XXXXXXXX"
                  className="iubenda-white iubenda-noiframe iubenda-embed iubenda-nostyle inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                  title="Privacy Policy"
                >
                  Apri la Privacy Policy
                </a>
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)]">
              <h3 className="text-xl font-semibold text-[#30486f]">Dati e finalità</h3>
              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                La documentazione privacy descrive quali dati possono essere trattati e per quali
                finalità vengono utilizzati all’interno della piattaforma.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)]">
              <h3 className="text-xl font-semibold text-[#30486f]">Diritti dell’utente</h3>
              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                L’utente può consultare le informazioni relative ai propri diritti e alle modalità
                per esercitarli nei casi previsti dalla normativa applicabile.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)]">
              <h3 className="text-xl font-semibold text-[#30486f]">Aggiornamenti</h3>
              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                La policy può essere aggiornata nel tempo per riflettere evoluzioni del servizio,
                adeguamenti normativi o nuove funzionalità della piattaforma.
              </p>
            </div>
          </section>
        </div>
      </section>

      <Script
        src="https://embeds.iubenda.com/widgets/0c85298b-fa1c-45b8-bd23-ea6bf73aec9c.js"
        strategy="afterInteractive"
      />
    </main>
  );
}