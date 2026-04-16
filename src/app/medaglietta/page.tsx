import Link from "next/link";

export default function MedagliettaPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f6f9fc_100%)]">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Medaglietta UNIMALIA
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
                La medaglietta intelligente per proteggere meglio il tuo animale
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-[#55657d] sm:text-lg">
                Stiamo preparando la medaglietta UNIMALIA con QR emergenza già configurato, pensata
                per rendere l’identità animale ancora più utile nella vita reale.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#55657d] sm:text-base">
                Resistente, pronta all’uso e collegata al profilo del tuo animale: una soluzione
                semplice, concreta e sempre con te.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/identita"
                  className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                >
                  Vai alle identità animali
                </Link>

                <Link
                  href="/scopri-unimalia"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-6 py-3.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Scopri UNIMALIA
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dbe5ef] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8 lg:p-10">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                In preparazione
              </div>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Più riconoscibilità. Più accesso rapido. Più sicurezza.
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
                La medaglietta nasce per trasformare l’identità animale in qualcosa di visibile,
                utile e immediato anche fuori dallo schermo.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">QR emergenza già pronto</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    La medaglietta sarà pensata per collegare subito il QR emergenza alla scheda del
                    tuo animale, senza configurazioni complicate.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Resistente e pronta all’uso</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Un supporto fisico pratico, progettato per accompagnare il tuo animale ogni
                    giorno, in casa e fuori.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Spedita direttamente a casa</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    L’obiettivo è offrirti una soluzione semplice: ordinare, ricevere e usare subito
                    la medaglietta UNIMALIA.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)]">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] text-lg font-semibold text-white shadow-[0_10px_24px_rgba(48,72,111,0.22)]">
                1
              </div>

              <h3 className="mt-5 text-xl font-semibold text-[#30486f]">
                Più facile da portare sempre con sé
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                La medaglietta rende l’identità animale fisica e immediata, aggiungendo uno strato
                concreto di accessibilità nella quotidianità.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)]">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] text-lg font-semibold text-white shadow-[0_10px_24px_rgba(48,72,111,0.22)]">
                2
              </div>

              <h3 className="mt-5 text-xl font-semibold text-[#30486f]">
                Più utile nei momenti imprevisti
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                In una passeggiata, in viaggio o in una situazione inattesa, avere un QR emergenza
                sempre presente può fare la differenza.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)]">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] text-lg font-semibold text-white shadow-[0_10px_24px_rgba(48,72,111,0.22)]">
                3
              </div>

              <h3 className="mt-5 text-xl font-semibold text-[#30486f]">
                Più coerente con l’identità animale digitale
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#55657d]">
                La medaglietta completa la visione UNIMALIA: unire identità digitale, accesso rapido
                e continuità in un ecosistema unico.
              </p>
            </div>
          </section>

          <section className="mt-10 rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Nel frattempo
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                Puoi già usare il QR emergenza del tuo animale
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#55657d]">
                Mentre la medaglietta ufficiale è in preparazione, puoi già generare il QR emergenza
                e usarlo liberamente nel modo che preferisci.
              </p>

              <div className="mt-6 rounded-[22px] border border-[#dbe5ef] bg-white px-5 py-4">
                <p className="text-sm font-semibold text-[#30486f]">
                  Soluzione temporanea già disponibile
                </p>
                <p className="mt-2 text-sm leading-7 text-[#55657d]">
                  Puoi creare il QR emergenza, stamparlo e applicarlo in autonomia in attesa della
                  medaglietta UNIMALIA pronta all’uso.
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/identita"
                  className="inline-flex items-center justify-center rounded-full bg-[#30486f] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
                >
                  Apri identità animale
                </Link>

                <Link
                  href="/prezzi"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-6 py-3.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]"
                >
                  Scopri i piani owner
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-10 rounded-[30px] border border-[#e3e9f0] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.2)] sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Prossima evoluzione owner
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                La medaglietta intelligente sarà uno dei modi più concreti per portare UNIMALIA nel
                mondo reale
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/85 sm:text-base">
                Non solo un accessorio, ma un’estensione pratica dell’identità animale digitale:
                semplice, immediata e pensata per proteggere meglio ciò che conta.
              </p>

              <div className="mt-8">
                <Link
                  href="/identita"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#30486f] transition hover:bg-[#f4f7fb]"
                >
                  Torna alle identità
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}