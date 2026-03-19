import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import {
  buildIdentityBreadcrumbJsonLd,
  buildIdentityFaqJsonLd,
  buildIdentityPageMetadata,
  buildIdentityWebPageJsonLd,
} from "@/lib/seo/identityAnimal";

const pagePath = "/identita-animale/microchip-vs-identita-digitale";
const pageTitle = "Microchip vs identità digitale";
const pageDescription =
  "Scopri la differenza tra microchip e identità digitale animale: cosa cambia, a cosa servono e perché non sono la stessa cosa.";

export const metadata: Metadata = buildIdentityPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const faqItems = [
  {
    question: "Il microchip e l’identità digitale sono la stessa cosa?",
    answer:
      "No. Il microchip è uno strumento ufficiale di identificazione; l’identità digitale serve a organizzare e rendere più accessibili online le informazioni utili.",
  },
  {
    question: "L’identità digitale sostituisce il microchip?",
    answer:
      "No. Non lo sostituisce. Può però affiancarlo migliorando la gestione pratica e digitale dei dati dell’animale.",
  },
  {
    question: "Perché usarli insieme?",
    answer:
      "Perché hanno funzioni diverse e complementari: il microchip identifica formalmente, l’identità digitale aiuta a gestire informazioni, aggiornamenti e consultazione.",
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

export default function MicrochipVsIdentitaDigitalePage() {
  const breadcrumbJsonLd = buildIdentityBreadcrumbJsonLd([
    { name: "Home", item: "https://www.unimalia.it/" },
    { name: "Microchip vs identità digitale", item: "https://www.unimalia.it/identita-animale/microchip-vs-identita-digitale" },
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
        id="jsonld-microchip-vs-identita-webpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <Script
        id="jsonld-microchip-vs-identita-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id="jsonld-microchip-vs-identita-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
            Guida identità animale
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Microchip vs identità digitale
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Microchip e identità digitale animale non sono la stessa cosa. Hanno ruoli
            diversi e proprio per questo possono essere complementari. Capire bene la
            differenza aiuta a spiegare meglio cosa fa UNIMALIA e perché può essere utile.
          </p>
        </header>

        <div className="mt-8 grid gap-6">
          <Section title="Cos’è il microchip">
            <p>
              Il microchip è uno strumento ufficiale di identificazione dell’animale.
              Ha una funzione formale e non coincide con una scheda digitale consultabile
              come contenuto informativo strutturato.
            </p>
          </Section>

          <Section title="Cos’è l’identità digitale animale">
            <p>
              L’identità digitale animale è una scheda online che aiuta a raccogliere e
              organizzare informazioni utili in modo più accessibile, aggiornabile e
              riutilizzabile.
            </p>
          </Section>

          <Section title="Differenza reale">
            <ul className="list-disc space-y-2 pl-6">
              <li>il microchip identifica formalmente</li>
              <li>l’identità digitale aiuta a gestire le informazioni</li>
              <li>il microchip non viene sostituito</li>
              <li>l’identità digitale può affiancare e migliorare la parte pratica</li>
            </ul>
          </Section>

          <Section title="Perché usarli insieme">
            <p>
              In una gestione moderna dell’animale, il valore sta proprio nella
              complementarità: identificazione ufficiale da una parte, ordine e
              accessibilità delle informazioni dall’altra.
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
                href="/identita-animale/cos-e-identita-animale-digitale"
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:bg-zinc-100"
              >
                <p className="text-lg font-semibold text-zinc-900">
                  Cos’è l’identità animale digitale
                </p>
              </Link>

              <Link
                href="/identita-animale/come-registrare-un-animale"
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:bg-zinc-100"
              >
                <p className="text-lg font-semibold text-zinc-900">
                  Come registrare un animale
                </p>
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}