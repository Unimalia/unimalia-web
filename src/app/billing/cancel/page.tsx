import Link from "next/link";

export default function BillingCancelPage() {
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
                Pagamento annullato
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[#55657d] sm:text-lg">
                Nessun addebito è stato completato e il tuo piano non è stato attivato.
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#55657d] sm:text-base">
                Puoi tornare indietro in qualsiasi momento e riprovare quando vuoi.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/prezzi"
                  className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                >
                  Torna ai prezzi
                </Link>

                <Link
                  href="/profilo"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Vai al profilo
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dbe5ef] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8 lg:p-10">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Nessuna attivazione
              </span>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Il piano Premium non è stato attivato
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
                Il pagamento è stato interrotto prima del completamento, quindi il tuo account
                resta invariato e nessuna funzione Premium viene abilitata.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Nessun addebito completato</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    L’operazione non è andata a buon fine e il piano non risulta attivo.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Account invariato</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Il tuo profilo continua a funzionare con lo stato attuale, senza modifiche.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Puoi riprovare quando vuoi</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Basta tornare alla pagina prezzi e ripetere l’operazione in un secondo momento.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-10 rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">
              Cosa puoi fare adesso
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-[#dbe5ef] bg-white p-5">
                <p className="text-sm font-semibold text-[#30486f]">1. Tornare ai prezzi</p>
                <p className="mt-2 text-sm leading-7 text-[#55657d]">
                  Rivedi il piano Premium e riprova più tardi.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#dbe5ef] bg-white p-5">
                <p className="text-sm font-semibold text-[#30486f]">2. Verificare il profilo</p>
                <p className="mt-2 text-sm leading-7 text-[#55657d]">
                  Controlla che il tuo account sia rimasto invariato come previsto.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#dbe5ef] bg-white p-5">
                <p className="text-sm font-semibold text-[#30486f]">3. Riprovare in seguito</p>
                <p className="mt-2 text-sm leading-7 text-[#55657d]">
                  Puoi completare l’attivazione in un secondo momento senza problemi.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}