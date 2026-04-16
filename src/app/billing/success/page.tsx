import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6f9fc_100%)]">
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Premium UNIMALIA
              </span>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
                Pagamento completato ✅
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[#55657d] sm:text-lg">
                Grazie. Il tuo abbonamento verrà attivato automaticamente entro pochi secondi.
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#55657d] sm:text-base">
                Se non vedi subito le modifiche, aggiorna la pagina oppure esci e rientra nel tuo
                account.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/profilo"
                  className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                >
                  Vai al profilo
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
                Attivazione in corso
              </span>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Il piano Premium sta per essere collegato al tuo account
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
                L’aggiornamento è normalmente rapido. In pochi istanti il tuo profilo dovrebbe
                riflettere lo stato corretto dell’abbonamento.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Accesso più completo</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Le funzionalità Premium verranno abilitate sul tuo profilo non appena
                    l’attivazione sarà completata.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Aggiornamento automatico</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Non serve fare altro: il sistema aggiorna l’account automaticamente.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Controllo rapido</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Se non vedi subito la variazione, ricarica la pagina o rientra nell’account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-10 rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
              Cosa succede adesso
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-[#dbe5ef] bg-white p-5">
                <p className="text-sm font-semibold text-[#30486f]">1. Conferma pagamento</p>
                <p className="mt-2 text-sm leading-7 text-[#55657d]">
                  Il pagamento risulta completato correttamente.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#dbe5ef] bg-white p-5">
                <p className="text-sm font-semibold text-[#30486f]">2. Attivazione account</p>
                <p className="mt-2 text-sm leading-7 text-[#55657d]">
                  Il profilo viene aggiornato con il piano Premium.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#dbe5ef] bg-white p-5">
                <p className="text-sm font-semibold text-[#30486f]">3. Accesso alle funzioni</p>
                <p className="mt-2 text-sm leading-7 text-[#55657d]">
                  Le funzioni abilitate diventano disponibili nel tuo account.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}