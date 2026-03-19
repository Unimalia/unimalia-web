import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import {
  buildIdentityBreadcrumbJsonLd,
  buildIdentityFaqJsonLd,
  buildIdentityPageMetadata,
  buildIdentityWebPageJsonLd,
} from "@/lib/seo/identityAnimal";

const pagePath = "/identita-animale/cos-e-identita-animale-digitale";
const pageTitle = "Cos’è l’identità animale digitale";
const pageDescription =
  "Scopri cos’è l’identità animale digitale, a cosa serve, in cosa si differenzia dal microchip e perché può essere utile per gestione, smarrimenti e accessi clinici.";

export const metadata: Metadata = buildIdentityPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const faqItems = [
  {
    question: "Cos’è l’identità animale digitale?",
    answer:
      "È una scheda digitale che raccoglie e organizza informazioni utili sull’animale in modo più accessibile, aggiornabile e consultabile online.",
  },
  {
    question: "Sostituisce il microchip?",
    answer:
      "No. Il microchip resta lo strumento ufficiale di identificazione. L’identità digitale aiuta nella gestione pratica delle informazioni.",
  },
  {
    question: "A cosa serve concretamente?",
    answer:
      "Può essere utile per raccogliere dati essenziali, velocizzare consultazione, migliorare gestione smarrimenti e facilitare accessi autorizzati in ambito clinico.",
  },
  {
    question: "Chi la usa?",
    answer:
      "Può essere utile sia al proprietario sia ai professionisti autorizzati, a seconda del tipo di informazione e dei permessi concessi.",
  },
];

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

export default function IdentityAnimalDigitalPage() {
  const breadcrumbJsonLd = buildIdentityBreadcrumbJsonLd([
    { name: "Home", item: "https://www.unimalia.it/" },
    { name: "Identità animale", item: "https://www.unimalia.it/identita-animale/cos-e-identita-animale-digitale" },
  ]);

  const faqJsonLd = buildIdentityFaqJsonLd(faqItems);
  const webPageJsonLd = buildIdentityWebPageJsonLd({
    title: pageTitle,
    description: pageDescription,
    path: pagePath,
  });

  return (
    <main className="bg-zinc-50">
      <Script
        id="jsonld-identita-digitale-webpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <Script
        id="jsonld-identita-digitale-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id="jsonld-identita-digitale-faq"
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
            <li className="text-zinc-700">Cos’è l’identità animale digitale</li>
          </ol>
        </nav>

        <header className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
            Guida identità animale
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Cos’è l’identità animale digitale
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            L’identità animale digitale è un modo più ordinato per raccogliere e
            gestire online le informazioni utili di un animale. Non sostituisce il
            microchip, ma può aiutare il proprietario e i professionisti autorizzati a
            consultare dati essenziali in modo più semplice, aggiornabile e coerente.
          </p>
        </header>

        <div className="mt-8 grid gap-6">
          <Section title="Definizione semplice">
            <p>
              L’identità animale digitale è una scheda online che raccoglie in modo
              strutturato i dati principali dell’animale: informazioni anagrafiche,
              elementi identificativi, dati utili per riconoscerlo e, nei casi previsti,
              accessi controllati a funzioni aggiuntive.
            </p>
          </Section>

          <Section title="A cosa serve davvero">
            <ul className="list-disc space-y-2 pl-6">
              <li>tenere in ordine i dati essenziali dell’animale</li>
              <li>avere una base unica e aggiornata</li>
              <li>gestire meglio smarrimenti e ritrovamenti</li>
              <li>favorire consultazione più rapida delle informazioni utili</li>
              <li>supportare accessi autorizzati in ambito clinico</li>
            </ul>
          </Section>

          <Section title="Perché può essere utile">
            <p>
              Spesso le informazioni su un animale sono disperse tra documenti,
              messaggi, foto, note o piattaforme diverse. L’identità digitale aiuta a
              ridurre questa dispersione e a creare un punto unico, più ordinato e più
              facile da aggiornare.
            </p>
          </Section>

          <Section title="Domande frequenti">
            <div className="space-y-5">
              {faqItems.map((item) => (
                <div key={item.question}>
                  <h3 className="text-lg font-semibold text-zinc-900">{item.question}</h3>
                  <p className="mt-2">{item.answer}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Guide correlate">
            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href="/identita-animale/come-registrare-un-animale"
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:bg-zinc-100"
              >
                <p className="text-lg font-semibold text-zinc-900">
                  Come registrare un animale
                </p>
              </Link>

              <Link
                href="/identita-animale/microchip-vs-identita-digitale"
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:bg-zinc-100"
              >
                <p className="text-lg font-semibold text-zinc-900">
                  Microchip vs identità digitale
                </p>
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}