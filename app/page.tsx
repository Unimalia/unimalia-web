// app/page.tsx
import Link from "next/link";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
      {children}
    </span>
  );
}

function WarmBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
      {children}
    </span>
  );
}

function IconChip({ emoji }: { emoji: string }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <span className="text-lg" aria-hidden="true">
        {emoji}
      </span>
    </span>
  );
}

export default function HomePage() {
  return (
    <main className="bg-zinc-50">
      {/* HERO */}
      <section className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* top micro line */}
            <div className="flex flex-wrap items-center gap-2">
              <WarmBadge>
                <span aria-hidden="true">❤️</span> Serio ma umano
              </WarmBadge>
              <Pill>
                <span aria-hidden="true">🔒</span> Dati protetti (RLS)
              </Pill>
              <Pill>
                <span aria-hidden="true">🪪</span> Identità digitale
              </Pill>
            </div>

            <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              {/* left */}
              <div className="max-w-2xl">
                <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                  UNIMALIA
                </h1>

                <p className="mt-4 text-base leading-relaxed text-zinc-600">
                  Un ecosistema digitale per proteggere e valorizzare la vita dell’animale:
                  identità, smarrimenti, servizi e adozioni. Pulito, affidabile, immediato.
                </p>

                {/* warm highlight strip */}
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Se succede qualcosa, hai tutto pronto.
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-800">
                    Scheda animale, codici, contatti e percorso rapido per pubblicare uno smarrimento.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/identita/nuovo"
                    className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Crea identità animale
                  </Link>

                  <Link
                    href="/smarrimenti/nuovo"
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    Pubblica smarrimento
                  </Link>

                  <Link
                    href="/professionisti"
                    className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
                  >
                    Portale professionisti →
                  </Link>
                </div>

                <p className="mt-6 text-xs leading-relaxed text-zinc-500">
                  Nota: UNIMALIA non sostituisce i documenti ufficiali. L’identità digitale è uno
                  strumento pratico per emergenze e gestione quotidiana.
                </p>
              </div>

              {/* right quick panel */}
              <div className="w-full md:max-w-sm">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-900">Azioni rapide</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Vai dritto al punto, senza confusione.
                  </p>

                  <div className="mt-4 grid gap-3">
                    <Link
                      href="/identita"
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      I miei animali
                    </Link>
                    <Link
                      href="/smarrimenti"
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Smarrimenti
                    </Link>
                    <Link
                      href="/ritrovati"
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Ritrovati
                    </Link>
                  </div>

                  <div className="mt-5 border-t border-zinc-200 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <WarmBadge>
                        <span aria-hidden="true">🧭</span> Chiaro
                      </WarmBadge>
                      <WarmBadge>
                        <span aria-hidden="true">🤝</span> Affidabile
                      </WarmBadge>
                      <WarmBadge>
                        <span aria-hidden="true">✨</span> Essenziale
                      </WarmBadge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* value props: warm minimal */}
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <IconChip emoji="🪪" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Identità chiara</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                      Dati essenziali, sempre pronti quando servono davvero.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <IconChip emoji="🔎" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Smarrimenti rapidi</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                      Pubblica e consulta annunci con un flusso semplice e pulito.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <IconChip emoji="👨‍⚕️" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Portale professionisti</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                      Verifica microchip e strumenti dedicati, separati dal pubblico.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* small warm divider section */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  “Si diventa enormi facendo benissimo una cosa minuscola.”
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Qui ogni funzione nasce per essere semplice, affidabile, utile.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Accedi / Registrati
                </Link>
                <Link
                  href="/identita"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Inizia ora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 SEZIONI PRINCIPALI */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Quattro sezioni. Un percorso chiaro.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Ogni area ha un obiettivo preciso. Niente rumore. Solo utilità.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Smarrimenti */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <WarmBadge>
                    <span aria-hidden="true">🔎</span> Emergenza
                  </WarmBadge>
                  <h3 className="mt-3 text-xl font-semibold text-zinc-900">Smarrimenti</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Quando conta la velocità: pubblica uno smarrimento o consulta gli annunci.
                  </p>
                </div>
                <IconChip emoji="📍" />
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/smarrimenti/nuovo"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Pubblica
                </Link>
                <Link
                  href="/smarrimenti"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Consulta
                </Link>
              </div>
            </div>

            {/* Identità */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <WarmBadge>
                    <span aria-hidden="true">🪪</span> Identificazione
                  </WarmBadge>
                  <h3 className="mt-3 text-xl font-semibold text-zinc-900">Identità animale</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Crea e gestisci la scheda dell’animale: dati, microchip e codice UNIMALIA.
                  </p>
                </div>
                <IconChip emoji="🐶" />
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/identita/nuovo"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Crea scheda
                </Link>
                <Link
                  href="/identita"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  I miei animali
                </Link>
              </div>
            </div>

            {/* Servizi */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <WarmBadge>
                    <span aria-hidden="true">🏥</span> Supporto
                  </WarmBadge>
                  <h3 className="mt-3 text-xl font-semibold text-zinc-900">Servizi</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Professionisti e strutture selezionate. Pensato per qualità e affidabilità.
                  </p>
                </div>
                <IconChip emoji="🩺" />
              </div>
              <div className="mt-5">
                <Link
                  href="/servizi"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Cerca servizi
                </Link>
              </div>
            </div>

            {/* Adotta */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <WarmBadge>
                    <span aria-hidden="true">❤️</span> Valore
                  </WarmBadge>
                  <h3 className="mt-3 text-xl font-semibold text-zinc-900">Adotta</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Annunci gratuiti e filtri chiari. Prima pulito, poi potente.
                  </p>
                </div>
                <IconChip emoji="🏡" />
              </div>
              <div className="mt-5">
                <Link
                  href="/adotta"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Vai ad adotta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}