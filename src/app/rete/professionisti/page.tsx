import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

const SITE_URL = "https://www.unimalia.it";
const pagePath = "/rete/professionisti";
const pageTitle = "Professionisti e servizi nella Rete UNIMALIA";
const pageDescription =
  "Scopri come UNIMALIA può aiutare toelettatori, pensioni, pet sitter, educatori e altri professionisti del settore animale, con una piattaforma in evoluzione e strumenti dedicati.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: `${SITE_URL}${pagePath}`,
  },
  openGraph: {
    title: `${pageTitle} | UNIMALIA`,
    description: pageDescription,
    url: `${SITE_URL}${pagePath}`,
    siteName: "UNIMALIA",
    locale: "it_IT",
    type: "article",
    images: [`${SITE_URL}/logo-512.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | UNIMALIA`,
    description: pageDescription,
    images: [`${SITE_URL}/logo-512.png`],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Chi può iscriversi come professionista su UNIMALIA?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Possono iscriversi toelettatori, pensioni per animali, educatori, pet sitter e altri professionisti del settore animale.",
      },
    },
    {
      "@type": "Question",
      name: "Le funzioni sono già definitive per tutti i professionisti?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. La piattaforma è in evoluzione e le funzioni possono ampliarsi nel tempo in base al tipo di professionista e allo sviluppo del progetto.",
      },
    },
    {
      "@type": "Question",
      name: "Ci saranno anche le prenotazioni online?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Sì, in futuro UNIMALIA è pensata per integrare anche strumenti come le prenotazioni online.",
      },
    },
  ],
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}${pagePath}#webpage`,
  url: `${SITE_URL}${pagePath}`,
  name: `${pageTitle} | UNIMALIA`,
  description: pageDescription,
  inLanguage: "it-IT",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[#55657d] sm:text-base">{children}</div>
    </section>
  );
}

function CtaButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-full bg-[#30486f] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(48,72,111,0.18)] transition hover:bg-[#263b59]"
      : "inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-semibold text-[#30486f] transition hover:bg-[#f8fbff]";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function ReteProfessionistiPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f6f9fc_100%)]">
      <Script
        id="jsonld-rete-professionisti-webpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <Script
        id="jsonld-rete-professionisti-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-[#5f708a]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition hover:text-[#30486f]">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/professionisti/login" className="transition hover:text-[#30486f]">
                Portale Professionisti
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#30486f]">Professionisti</li>
          </ol>
        </nav>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <header className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f708a]">
                Rete UNIMALIA
              </span>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#30486f] sm:text-5xl">
                Professionisti e servizi nella Rete UNIMALIA
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[#55657d] sm:text-lg">
                UNIMALIA è una piattaforma in evoluzione pensata anche per i professionisti del
                settore animale. Oltre all’area veterinaria, possono entrare nella rete anche altre
                figure come toelettatori, pensioni, educatori, pet sitter e altri servizi dedicati
                agli animali.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CtaButton href="/professionisti/login?mode=signup">
                  Registrati come professionista
                </CtaButton>
                <CtaButton href="/professionisti/login" variant="secondary">
                  Accedi al portale
                </CtaButton>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dbe5ef] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8 lg:p-10">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Area in evoluzione
              </span>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Una presenza professionale più visibile, più ordinata, più utile
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/85 sm:text-base">
                L’obiettivo è costruire uno spazio dedicato a chi lavora ogni giorno con gli
                animali, con strumenti pratici, visibilità sul sito e un ecosistema destinato a
                crescere nel tempo.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Presenza nella rete</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    La piattaforma aiuta a valorizzare attività, competenze e area geografica del
                    professionista.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Portale dedicato</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Un accesso separato dal lato owner, pensato per strumenti, flussi e funzioni
                    più adatti al lavoro professionale.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Crescita futura</h3>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    La rete è costruita per accogliere evoluzioni progressive, comprese future
                    funzioni operative come le prenotazioni online.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <Section title="Chi può iscriversi">
              <ul className="list-disc space-y-2 pl-6">
                <li>toelettatori</li>
                <li>pensioni per animali</li>
                <li>educatori e addestratori</li>
                <li>pet sitter</li>
                <li>altri professionisti del settore animale</li>
              </ul>
            </Section>

            <Section title="Una piattaforma in evoluzione">
              <p>
                UNIMALIA non è pensata come uno strumento statico. Le funzioni disponibili per i
                professionisti possono crescere nel tempo in base al ruolo e allo sviluppo del
                progetto.
              </p>
              <p>
                L’obiettivo è costruire un ecosistema più ordinato, utile e accessibile per chi
                lavora ogni giorno con gli animali.
              </p>
            </Section>

            <Section title="Essere presenti sulla piattaforma">
              <p>
                Uno dei vantaggi della rete è la possibilità di essere trovati anche all’interno del
                sito, in base alla zona e alle competenze reali del professionista.
              </p>
              <p>
                Questo aiuta i proprietari a orientarsi meglio e rende più semplice scoprire servizi
                specifici direttamente sulla piattaforma.
              </p>
            </Section>

            <Section title="Prenotazioni online in futuro">
              <p>
                In futuro UNIMALIA è pensata per integrare anche strumenti evoluti come le
                prenotazioni online.
              </p>
              <p>
                La piattaforma sta crescendo per offrire un’esperienza sempre più completa sia ai
                professionisti sia ai proprietari.
              </p>
            </Section>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-[28px] border border-[#e3e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <span className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Perché entrare nella rete
              </span>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                Più credibilità, più visibilità, più opportunità
              </h2>

              <ul className="mt-6 list-disc space-y-3 pl-6 text-sm leading-7 text-[#55657d] sm:text-base">
                <li>entri in una rete dedicata al settore animale</li>
                <li>puoi essere trovato più facilmente sulla piattaforma</li>
                <li>hai accesso a un portale professionale dedicato</li>
                <li>ti prepari a strumenti futuri in evoluzione, come le prenotazioni online</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_34px_rgba(48,72,111,0.05)] sm:p-8">
              <span className="inline-flex items-center rounded-full border border-[#dbe5ef] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f708a]">
                Richiedi informazioni
              </span>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#30486f]">
                Vuoi capire se UNIMALIA è adatta alla tua attività?
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#55657d] sm:text-base">
                Se vuoi capire meglio come funziona UNIMALIA per la tua attività, puoi contattarci
                direttamente.
              </p>

              <div className="mt-6 rounded-[22px] border border-[#dbe5ef] bg-[#f8fbff] px-5 py-4">
                <p className="text-sm font-semibold text-[#30486f]">Contatto dedicato</p>
                <p className="mt-2 text-sm leading-7 text-[#55657d]">
                  professionisti@unimalia.it
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <CtaButton href="/professionisti/login?mode=signup">
                  Registrati ora
                </CtaButton>
                <CtaButton href="/professionisti/login" variant="secondary">
                  Accedi al portale
                </CtaButton>
              </div>
            </div>
          </section>

          <section className="mt-10 rounded-[30px] border border-[#e3e9f0] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 text-white shadow-[0_22px_50px_rgba(48,72,111,0.2)] sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Rete professionisti
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                UNIMALIA sta costruendo uno spazio più moderno per chi lavora davvero con gli animali
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/85 sm:text-base">
                Una rete più visibile, una piattaforma più ordinata e un ecosistema destinato a
                crescere insieme ai professionisti del settore animale.
              </p>

              <div className="mt-8">
                <CtaButton href="/professionisti/login?mode=signup">
                  Entra nella rete
                </CtaButton>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}