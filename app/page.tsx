// app/page.tsx
import Link from "next/link";

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">{children}</div>;
}

function Pill({
  children,
  tone = "zinc",
}: {
  children: React.ReactNode;
  tone?: "zinc" | "amber" | "teal";
}) {
  const cls =
    tone === "amber"
      ? "border-amber-200/80 bg-amber-50 text-amber-900"
      : tone === "teal"
        ? "border-teal-200/80 bg-teal-50 text-teal-900"
        : "border-zinc-200 bg-white/80 text-zinc-700";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${cls}`}>
      {children}
    </span>
  );
}

function PrimaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
    >
      {children}
    </Link>
  );
}

function SecondaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
    >
      {children}
    </Link>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
  hrefPrimary,
  labelPrimary,
  hrefSecondary,
  labelSecondary,
  tone,
}: {
  title: string;
  desc: string;
  icon: string;
  hrefPrimary: string;
  labelPrimary: string;
  hrefSecondary?: string;
  labelSecondary?: string;
  tone: "amber" | "teal" | "zinc";
}) {
  const accent =
    tone === "amber"
      ? "from-amber-300/70 to-amber-500/40"
      : tone === "teal"
        ? "from-teal-300/70 to-teal-500/40"
        : "from-zinc-300/70 to-zinc-500/30";

  const pillTone = tone === "zinc" ? "zinc" : tone;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div aria-hidden="true" className={`h-1 w-full bg-gradient-to-r ${accent}`} />
      <div className="p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Pill tone={pillTone}>
              <span aria-hidden="true">
                {tone === "amber" ? "❤️" : tone === "teal" ? "🛡️" : "🔷"}
              </span>
              {tone === "amber" ? "Essenziale" : tone === "teal" ? "Fiducia" : "Sezione"}
            </Pill>

            <h3 className="mt-3 text-xl font-semibold text-zinc-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{desc}</p>
          </div>

          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <span className="text-lg" aria-hidden="true">
              {icon}
            </span>
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={hrefPrimary}
            className="rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            {labelPrimary}
          </Link>

          {hrefSecondary && labelSecondary ? (
            <Link
              href={hrefSecondary}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              {labelSecondary}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-auto px-7 pb-7">
        <div className="h-px w-full bg-zinc-200/70" />
        <p className="mt-3 text-xs text-zinc-500">
          Poche cose, fatte bene. E veloci quando serve.
        </p>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  desc,
  tone,
}: {
  n: string;
  title: string;
  desc: string;
  tone: "amber" | "teal" | "zinc";
}) {
  const badge =
    tone === "amber"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : tone === "teal"
        ? "bg-teal-50 text-teal-900 border-teal-200"
        : "bg-white text-zinc-800 border-zinc-200";

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
      <div className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1 text-xs font-semibold ${badge}`}>
        <span aria-hidden="true">✨</span> Step {n}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-zinc-50">
      {/* HERO full-bleed */}
      <section className="relative overflow-hidden border-b border-zinc-200">
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-amber-50 via-zinc-50 to-zinc-50" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-amber-300/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-28 h-[28rem] w-[28rem] rounded-full bg-teal-300/20 blur-3xl" />

        <Container>
          <div className="relative py-14 sm:py-20">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="amber">
                <span aria-hidden="true">❤️</span> Serio ma umano
              </Pill>
              <Pill>
                <span aria-hidden="true">🪪</span> Identità digitale
              </Pill>
              <Pill>
                <span aria-hidden="true">🔎</span> Smarrimenti
              </Pill>
              <Pill>
                <span aria-hidden="true">👨‍⚕️</span> Professionisti
              </Pill>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-start">
              {/* Left */}
              <div className="lg:col-span-7">
                <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
                  UNIMALIA
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-700">
                  Un ecosistema digitale per proteggere la vita dell’animale.
                  <br />
                  Poche cose, fatte bene: identità, codici, smarrimenti e strumenti per i professionisti.
                </p>

                <div className="mt-7 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-amber-900">
                    In emergenza conta la semplicità.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-amber-800">
                    Apri la scheda dell’animale e hai QR/Barcode pronti per condivisione o verifica.
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <PrimaryCTA href="/identita/nuovo">Crea identità animale</PrimaryCTA>
                  <SecondaryCTA href="/smarrimenti/nuovo">Pubblica smarrimento</SecondaryCTA>
                  <Link href="/login" className="text-sm font-semibold text-zinc-700 hover:text-zinc-900">
                    Accedi →
                  </Link>
                </div>

                <p className="mt-8 text-xs text-zinc-500">
                  “Si diventa enormi facendo benissimo una cosa minuscola.”
                </p>
              </div>

              {/* Right: “dashboard” visual (no images, just design) */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-900">Azioni rapide</p>
                  <p className="mt-1 text-sm text-zinc-600">Vai dritto al punto.</p>

                  <div className="mt-5 grid gap-3">
                    <Link
                      href="/identita"
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                    >
                      Le mie identità
                    </Link>
                    <Link
                      href="/smarrimenti"
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                    >
                      Smarrimenti
                    </Link>
                    <Link
                      href="/professionisti"
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                    >
                      Portale professionisti
                    </Link>
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-teal-200 bg-teal-50 p-5">
                      <p className="text-xs font-semibold text-teal-900">Fiducia</p>
                      <p className="mt-2 text-sm font-semibold text-zinc-900">Dati essenziali</p>
                      <p className="mt-1 text-xs leading-relaxed text-teal-800">
                        Solo ciò che serve, in modo leggibile.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                      <p className="text-xs font-semibold text-amber-900">Velocità</p>
                      <p className="mt-2 text-sm font-semibold text-zinc-900">QR pronto</p>
                      <p className="mt-1 text-xs leading-relaxed text-amber-800">
                        Condivisione immediata quando conta.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS full-width alt bg */}
      <section className="bg-white">
        <Container>
          <div className="py-14 sm:py-16">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Come funziona
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Pensato per essere utile in due momenti: prevenzione e emergenza.
            </p>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <Step
                n="1"
                title="Crea l’identità"
                desc="Inserisci i dati essenziali. Ottieni QR/Barcode pronti."
                tone="amber"
              />
              <Step
                n="2"
                title="Condividi e proteggi"
                desc="Stampa, salva, condividi. L’identità è sempre accessibile."
                tone="teal"
              />
              <Step
                n="3"
                title="In emergenza: agisci subito"
                desc="Pubblica smarrimento e fai girare l’informazione in modo pulito."
                tone="zinc"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* FEATURES */}
      <section className="bg-zinc-50">
        <Container>
          <div className="py-14 sm:py-16">
            <h2 className="sr-only">Sezioni principali</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <FeatureCard
                title="Smarrimenti"
                desc="Pubblica o consulta annunci con informazioni essenziali e flusso rapido."
                hrefPrimary="/smarrimenti/nuovo"
                labelPrimary="Pubblica"
                hrefSecondary="/smarrimenti"
                labelSecondary="Consulta"
                icon="📍"
                tone="teal"
              />
              <FeatureCard
                title="Identità animale"
                desc="Scheda completa con microchip e codici (QR + barcode) pronti."
                hrefPrimary="/identita/nuovo"
                labelPrimary="Crea scheda"
                hrefSecondary="/identita"
                labelSecondary="Apri identità"
                icon="🪪"
                tone="amber"
              />
              <FeatureCard
                title="Servizi"
                desc="Trova professionisti e strutture. Sezione in crescita."
                hrefPrimary="/servizi"
                labelPrimary="Cerca servizi"
                icon="🩺"
                tone="zinc"
              />
              <FeatureCard
                title="Adotta"
                desc="Annunci e filtri (in arrivo). Prima pulito, poi potente."
                hrefPrimary="/adotta"
                labelPrimary="Vai ad adota"
                icon="🏡"
                tone="zinc"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white border-t border-zinc-200">
        <Container>
          <div className="py-14 sm:py-16">
            <div className="rounded-[2.5rem] border border-zinc-200 bg-gradient-to-br from-amber-50 via-white to-teal-50 p-8 shadow-sm sm:p-10">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                Se trovi un animale, ogni secondo conta.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
                Preparati prima: crea l’identità, stampa il QR, e riduci il caos quando serve lucidità.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <PrimaryCTA href="/identita/nuovo">Crea identità ora</PrimaryCTA>
                <SecondaryCTA href="/smarrimenti/nuovo">Pubblica smarrimento</SecondaryCTA>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}