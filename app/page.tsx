// app/page.tsx
import Link from "next/link";

function Badge({ children }: { children: React.ReactNode }) {
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

function ActionCard({
  title,
  desc,
  hrefPrimary,
  labelPrimary,
  hrefSecondary,
  labelSecondary,
  icon,
  warm,
}: {
  title: string;
  desc: string;
  hrefPrimary: string;
  labelPrimary: string;
  hrefSecondary?: string;
  labelSecondary?: string;
  icon: string;
  warm?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {warm ? (
            <WarmBadge>
              <span aria-hidden="true">❤️</span> Essenziale
            </WarmBadge>
          ) : (
            <Badge>
              <span aria-hidden="true">🔷</span> Sezione
            </Badge>
          )}
          <h3 className="mt-3 text-xl font-semibold text-zinc-900">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{desc}</p>
        </div>

        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <span className="text-lg" aria-hidden="true">
            {icon}
          </span>
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={hrefPrimary}
          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          {labelPrimary}
        </Link>

        {hrefSecondary && labelSecondary ? (
          <Link
            href={hrefSecondary}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            {labelSecondary}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-zinc-50">
      {/* HERO */}
      <section className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <WarmBadge>
                <span aria-hidden="true">❤️</span> Serio ma umano
              </WarmBadge>
              <Badge>
                <span aria-hidden="true">🪪</span> Identità digitale
              </Badge>
              <Badge>
                <span aria-hidden="true">🔎</span> Smarrimenti
              </Badge>
              <Badge>
                <span aria-hidden="true">👨‍⚕️</span> Professionisti
              </Badge>
            </div>

            <div className="mt-6 grid gap-8 md:grid-cols-12 md:items-start">
              <div className="md:col-span-8">
                <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                  UNIMALIA
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
                  Un ecosistema digitale per proteggere la vita dell’animale. Poche cose, fatte bene:
                  identità, codici, smarrimenti e strumenti per i professionisti.
                </p>

                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    In emergenza conta la semplicità.
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-800">
                    Apri la scheda dell’animale e hai QR/Barcode pronti per condivisione o verifica.
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
                    href="/login"
                    className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
                  >
                    Accedi →
                  </Link>
                </div>

                <p className="mt-6 text-xs leading-relaxed text-zinc-500">
                  “Si diventa enormi facendo benissimo una cosa minuscola.”
                </p>
              </div>

              <div className="md:col-span-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-900">Azioni rapide</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Vai dritto al punto.
                  </p>

                  <div className="mt-4 grid gap-3">
                    <Link
                      href="/identita"
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Le mie identità
                    </Link>
                    <Link
                      href="/smarrimenti"
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Smarrimenti
                    </Link>
                    <Link
                      href="/professionisti"
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Portale professionisti
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 SEZIONI */}
          <h2 className="sr-only">Sezioni principali</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <ActionCard
              title="Smarrimenti"
              desc="Pubblica o consulta annunci con informazioni essenziali e flusso rapido."
              hrefPrimary="/smarrimenti/nuovo"
              labelPrimary="Pubblica"
              hrefSecondary="/smarrimenti"
              labelSecondary="Consulta"
              icon="📍"
            />

            <ActionCard
              title="Identità animale"
              desc="Scheda completa con microchip e codici (QR + barcode) pronti."
              hrefPrimary="/identita/nuovo"
              labelPrimary="Crea scheda"
              hrefSecondary="/identita"
              labelSecondary="Apri identità"
              icon="🪪"
              warm
            />

            <ActionCard
              title="Servizi"
              desc="Trova professionisti e strutture. Sezione in crescita."
              hrefPrimary="/servizi"
              labelPrimary="Cerca servizi"
              icon="🩺"
            />

            <ActionCard
              title="Adotta"
              desc="Annunci e filtri (in arrivo). Prima pulito, poi potente."
              hrefPrimary="/adotta"
              labelPrimary="Vai ad adotta"
              icon="🏡"
            />
          </div>
        </div>
      </section>
    </main>
  );
}