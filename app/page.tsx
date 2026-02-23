// app/page.tsx
import Link from "next/link";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function WarmBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm">
      {children}
    </span>
  );
}

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900 shadow-sm">
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
  accent,
}: {
  title: string;
  desc: string;
  hrefPrimary: string;
  labelPrimary: string;
  hrefSecondary?: string;
  labelSecondary?: string;
  icon: string;
  warm?: boolean;
  accent?: "amber" | "teal" | "zinc";
}) {
  const accentBorder =
    accent === "amber"
      ? "border-amber-200"
      : accent === "teal"
        ? "border-teal-200"
        : "border-zinc-200";

  const accentBg =
    accent === "amber"
      ? "bg-amber-50/60"
      : accent === "teal"
        ? "bg-teal-50/60"
        : "bg-white";

  return (
    <div
      className={`rounded-2xl border ${accentBorder} ${accentBg} p-6 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {warm ? (
            <WarmBadge>
              <span aria-hidden="true">❤️</span> Essenziale
            </WarmBadge>
          ) : accent === "teal" ? (
            <TrustBadge>
              <span aria-hidden="true">🛡️</span> Fiducia
            </TrustBadge>
          ) : (
            <Badge>
              <span aria-hidden="true">🔷</span> Sezione
            </Badge>
          )}

          <h3 className="mt-3 text-xl font-semibold text-zinc-900">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{desc}</p>
        </div>

        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white/80 shadow-sm">
          <span className="text-lg" aria-hidden="true">
            {icon}
          </span>
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={hrefPrimary}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          {labelPrimary}
        </Link>

        {hrefSecondary && labelSecondary ? (
          <Link
            href={hrefSecondary}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
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
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            {/* soft background accents */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-200/25 blur-3xl"
            />

            <div className="relative p-6 sm:p-10">
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

              <div className="mt-8 grid gap-10 md:grid-cols-12 md:items-start">
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

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      href="/identita/nuovo"
                      className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                    >
                      Crea identità animale
                    </Link>

                    <Link
                      href="/smarrimenti/nuovo"
                      className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
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

                  <p className="mt-7 text-xs leading-relaxed text-zinc-500">
                    “Si diventa enormi facendo benissimo una cosa minuscola.”
                  </p>
                </div>

                <div className="md:col-span-4">
                  <div className="rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                    <p className="text-sm font-semibold text-zinc-900">Azioni rapide</p>
                    <p className="mt-1 text-sm text-zinc-600">Vai dritto al punto.</p>

                    <div className="mt-4 grid gap-3">
                      <Link
                        href="/identita"
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                      >
                        Le mie identità
                      </Link>
                      <Link
                        href="/smarrimenti"
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                      >
                        Smarrimenti
                      </Link>
                      <Link
                        href="/professionisti"
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                      >
                        Portale professionisti
                      </Link>
                    </div>

                    <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-4">
                      <p className="text-sm font-semibold text-teal-900">
                        Fiducia, prima di tutto.
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-teal-800">
                        Dati essenziali, accesso rapido, e una struttura pensata per aiutare davvero.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* divider */}
              <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

              {/* 4 SEZIONI */}
              <h2 className="sr-only">Sezioni principali</h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <ActionCard
                  title="Smarrimenti"
                  desc="Pubblica o consulta annunci con informazioni essenziali e flusso rapido."
                  hrefPrimary="/smarrimenti/nuovo"
                  labelPrimary="Pubblica"
                  hrefSecondary="/smarrimenti"
                  labelSecondary="Consulta"
                  icon="📍"
                  accent="teal"
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
                  accent="amber"
                />

                <ActionCard
                  title="Servizi"
                  desc="Trova professionisti e strutture. Sezione in crescita."
                  hrefPrimary="/servizi"
                  labelPrimary="Cerca servizi"
                  icon="🩺"
                  accent="zinc"
                />

                <ActionCard
                  title="Adotta"
                  desc="Annunci e filtri (in arrivo). Prima pulito, poi potente."
                  hrefPrimary="/adotta"
                  labelPrimary="Vai ad adotta"
                  icon="🏡"
                  accent="zinc"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}