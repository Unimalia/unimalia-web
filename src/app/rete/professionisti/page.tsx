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
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h2>
      <div className="mt-4 space-y-4 text-zinc-700">{children}</div>
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
      ? "inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
      : "inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function ReteProfessionistiPage() {
  return (
    <main className="bg-zinc-50">
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

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-zinc-900">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/professionisti/login" className="hover:text-zinc-900">
                Portale Professionisti
              </Link>
            </li>
            <li>/</li>
            <li className="text-zinc-700">Professionisti</li>
          </ol>
        </nav>

        <header className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
            Rete UNIMALIA
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Professionisti e servizi nella Rete UNIMALIA
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            UNIMALIA è una piattaforma in evoluzione pensata anche per i professionisti del settore
            animale. Oltre all’area veterinaria, possono entrare nella rete anche altre figure
            come toelettatori, pensioni, educatori, pet sitter e altri servizi dedicati agli
            animali.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaButton href="/professionisti/login?mode=signup">Registrati come professionista</CtaButton>
            <CtaButton href="/professionisti/login" variant="secondary">
              Accedi al portale
            </CtaButton>
          </div>
        </header>

        <div className="mt-8 grid gap-6">
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

          <Section title="Perché entrare nella Rete UNIMALIA">
            <ul className="list-disc space-y-2 pl-6">
              <li>entri in una rete dedicata al settore animale</li>
              <li>puoi essere trovato più facilmente sulla piattaforma</li>
              <li>hai accesso a un portale professionale dedicato</li>
              <li>ti prepari a strumenti futuri in evoluzione, come le prenotazioni online</li>
            </ul>
          </Section>

          <Section title="Richiedi informazioni">
            <p>
              Se vuoi capire meglio come funziona UNIMALIA per la tua attività, puoi contattarci qui:
            </p>
            <p className="font-semibold text-zinc-900">professionisti@unimalia.it</p>
          </Section>
        </div>
      </div>
    </main>
  );
}