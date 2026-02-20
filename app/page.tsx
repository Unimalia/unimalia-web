// app/page.tsx
import Link from "next/link";

function Icon({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <span className="text-lg" aria-hidden="true">
        {children}
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
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                  <span aria-hidden="true">🔷</span>
                  Ecosistema digitale serio ma umano
                </div>

                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                  UNIMALIA
                </h1>

                <p className="mt-4 text-base leading-relaxed text-zinc-600">
                  Identità digitale dell’animale, gestione smarrimenti, servizi e adozioni.
                  Un posto unico, pulito e affidabile per proteggere e valorizzare la vita dell’animale.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/identita"
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

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    Microchip &amp; verifica
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    Smarrimenti rapidi
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    Adozioni (in arrivo)
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    Servizi (in crescita)
                  </span>
                </div>
              </div>

              {/* TRUST / QUICK PANEL */}
              <div className="w-full md:max-w-sm">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-900">Azioni rapide</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Vai dritto al punto, senza perdere tempo.
                  </p>

                  <div className="mt-4 grid gap-3">
                    <Link
                      href="/identita/nuovo"
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      + Nuovo animale
                    </Link>
                    <Link
                      href="/smarrimenti"
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Vedi smarrimenti
                    </Link>
                    <Link
                      href="/ritrovati"
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Vedi ritrovati
                    </Link>
                  </div>

                  <div className="mt-5 border-t border-zinc-200 pt-4">
                    <p className="text-xs leading-relaxed text-zinc-500">
                      Nota: l’identità digitale non sostituisce documenti ufficiali.
                      È uno strumento pratico per emergenze e gestione quotidiana.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VALUE PROPS */}
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <Icon>🪪</Icon>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Identità chiara</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    Dati essenziali sempre pronti: animale, proprietario, contatti e codici.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <Icon>🔎</Icon>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Smarrimenti veloci</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    Pubblica e consulta annunci con flusso semplice, pulito e immediato.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <Icon>👨‍⚕️</Icon>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Professionisti</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    Portale separato per verifica microchip e strumenti dedicati.
                  </p>
                </div>
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
                Tutto in quattro sezioni
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Percorsi semplici. Niente confusione. Ogni parte ha un obiettivo preciso.
              </p>
            </div>
            <Link
              href="/login"
              className="hidden sm:inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Accedi / Registrati
            </Link>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Smarrimenti */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-600">🔎 Emergenza</p>
                  <h3 className="mt-2 text-xl font-semibold text-zinc-900">Smarrimenti</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Pubblica uno smarrimento o consulta gli annunci.
                    Flusso rapido, informazioni essenziali, zero fronzoli.
                  </p>
                </div>
                <Icon>📍</Icon>
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
                  <p className="text-xs font-semibold text-zinc-600">🪪 Identificazione</p>
                  <h3 className="mt-2 text-xl font-semibold text-zinc-900">Identità animale</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Crea e gestisci la scheda dell’animale: dati, microchip e codice UNIMALIA.
                    Sempre pronta quando serve.
                  </p>
                </div>
                <Icon>🐶</Icon>
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
                  <p className="text-xs font-semibold text-zinc-600">🏥 Supporto</p>
                  <h3 className="mt-2 text-xl font-semibold text-zinc-900">Servizi</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Trova professionisti e strutture.
                    Un’area pensata per qualità e affidabilità.
                  </p>
                </div>
                <Icon>🩺</Icon>
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
                  <p className="text-xs font-semibold text-zinc-600">❤️ Valore</p>
                  <h3 className="mt-2 text-xl font-semibold text-zinc-900">Adotta</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Annunci gratuiti e filtri chiari.
                    Sezione in crescita: prima pulita, poi potente.
                  </p>
                </div>
                <Icon>🏡</Icon>
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

          {/* BOTTOM CTA */}
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Costruito per fare bene le cose importanti.
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  “Si diventa enormi facendo benissimo una cosa minuscola.”
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/profilo"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Completa profilo
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

          {/* Mobile login CTA */}
          <div className="mt-6 sm:hidden">
            <Link
              href="/login"
              className="block text-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Accedi / Registrati
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}