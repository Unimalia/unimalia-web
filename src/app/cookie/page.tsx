import Link from "next/link";

export default function CookiePage() {
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
            <li className="text-[#30486f]">Cookie Policy</li>
          </ol>
        </nav>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <header className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Informazioni legali
              </span>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
                Cookie Policy
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[#55657d] sm:text-lg">
                Questa pagina descrive in modo sintetico l’utilizzo dei cookie e di eventuali
                strumenti tecnici collegati al funzionamento del sito UNIMALIA.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Vai alla Privacy Policy
                </Link>

                <Link
                  href="/termini"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Vai ai Termini e condizioni
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dbe5ef] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8 lg:p-10">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Cookie e strumenti tecnici
              </span>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Trasparenza sul funzionamento del sito
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
                I cookie tecnici servono a far funzionare correttamente il sito, il login, la
                sicurezza e alcune funzioni essenziali. Eventuali integrazioni esterne possono usare
                strumenti propri secondo le rispettive policy.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Funzionamento base</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Alcuni cookie sono necessari per mantenere il sito stabile, sicuro e usabile.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Servizi esterni</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Strumenti come mappe o widget di terze parti possono applicare regole proprie.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Aggiornamenti</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Questa policy può evolvere con l’introduzione di nuove funzionalità o strumenti.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-10 space-y-6">
            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                1. Cookie tecnici
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                UNIMALIA utilizza cookie tecnici necessari al funzionamento del sito, del login,
                della sicurezza e delle funzionalità essenziali.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Senza questi cookie il sito potrebbe non funzionare correttamente oppure alcune
                sezioni potrebbero risultare non disponibili.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                2. Cookie di terze parti
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Il sito può integrare servizi esterni, ad esempio mappe o altri strumenti utili
                all’esperienza utente.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Questi servizi possono utilizzare cookie o strumenti analoghi secondo le proprie
                policy e condizioni di utilizzo.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                3. Gestione dei cookie
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Puoi gestire i cookie attraverso le impostazioni del tuo browser o degli strumenti
                di consenso eventualmente presenti sul sito.
              </p>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                La disattivazione di alcuni cookie tecnici può compromettere il corretto
                funzionamento della piattaforma.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
                4. Aggiornamenti della policy
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Questa Cookie Policy è in versione iniziale e potrà essere aggiornata con
                l’introduzione di nuove funzionalità, strumenti di analisi o modifiche tecniche del
                servizio.
              </p>

              <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-[#5f708a]">
                Versione iniziale — documento aggiornabile nel tempo
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}