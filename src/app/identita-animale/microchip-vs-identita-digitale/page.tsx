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
const pageTitle = "Microchip vs identitÃ  digitale";
const pageDescription =
  "Scopri la differenza tra microchip e identitÃ  digitale animale: cosa cambia, a cosa servono e perchÃ© non sono la stessa cosa in UNIMALIA.";

export const metadata: Metadata = buildIdentityPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const faqItems = [
  {
    question: "Il microchip e lâ€™identitÃ  digitale sono la stessa cosa?",
    answer:
      "No. Il microchip Ã¨ uno strumento ufficiale di identificazione, mentre lâ€™identitÃ  digitale serve a raccogliere e organizzare le informazioni utili dellâ€™animale in modo piÃ¹ accessibile.",
  },
  {
    question: "Lâ€™identitÃ  digitale sostituisce il microchip?",
    answer:
      "No. Non lo sostituisce. Sono due cose diverse e non vanno confuse.",
  },
  {
    question: "Serve avere il microchip per usare UNIMALIA?",
    answer:
      "No. Tutti gli animali possono avere unâ€™identitÃ  animale digitale anche senza microchip.",
  },
  {
    question: "Cosa succede se lâ€™animale non ha il microchip?",
    answer:
      "Per gli animali senza microchip, UNIMALIA puÃ² assegnare unâ€™identitÃ  digitale con QR code e barcode, cosÃ¬ da creare un riferimento chiaro e sempre disponibile.",
  },
  {
    question: "Quando il microchip câ€™Ã¨ giÃ , cosa cambia?",
    answer:
      "Il microchip continua a mantenere il suo ruolo. UNIMALIA aggiunge una gestione piÃ¹ ordinata e accessibile delle informazioni utili.",
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
    { name: "Home", item: "https://unimalia.it/" },
    {
      name: "Microchip vs identitÃ  digitale",
      item: "https://unimalia.it/identita-animale/microchip-vs-identita-digitale",
    },
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
            Guida identitÃ  animale
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Microchip vs identitÃ  digitale
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Microchip e identitÃ  digitale animale non sono la stessa cosa. Hanno ruoli
            diversi e non vanno confusi. Capire bene la differenza aiuta a spiegare cosa
            fa UNIMALIA, perchÃ© puÃ² essere utile anche senza microchip e come si inserisce
            nella gestione dellâ€™animale.
          </p>
        </header>

        <div className="mt-8 grid gap-6">
          <Section title="Cosâ€™Ã¨ il microchip">
            <p>
              Il microchip Ã¨ uno strumento ufficiale di identificazione dellâ€™animale.
              Ha un ruolo specifico e non coincide con una scheda digitale pensata per
              raccogliere e organizzare contenuti informativi.
            </p>
          </Section>

          <Section title="Cosâ€™Ã¨ lâ€™identitÃ  digitale animale">
            <p>
              Lâ€™identitÃ  digitale animale Ã¨ una scheda online che aiuta a raccogliere e
              organizzare le informazioni utili dellâ€™animale in modo piÃ¹ semplice,
              accessibile e aggiornabile.
            </p>
            <p>
              In UNIMALIA questa identitÃ  puÃ² esistere per tutti gli animali, anche per
              quelli che non hanno microchip.
            </p>
          </Section>

          <Section title="La differenza reale">
            <ul className="list-disc space-y-2 pl-6">
              <li>il microchip ha una funzione di identificazione ufficiale</li>
              <li>lâ€™identitÃ  digitale serve a organizzare le informazioni utili</li>
              <li>non sono la stessa cosa</li>
              <li>non devono essere confusi</li>
              <li>UNIMALIA non Ã¨ pensata solo per animali con microchip</li>
            </ul>
          </Section>

          <Section title="UNIMALIA serve anche senza microchip">
            <p>
              Questo Ã¨ un punto importante: non serve avere il microchip per usare
              UNIMALIA.
            </p>
            <p>
              Per gli animali che non ne hanno uno, UNIMALIA puÃ² assegnare unâ€™identitÃ 
              digitale con QR code e barcode, cosÃ¬ da creare un riferimento chiaro,
              consultabile e sempre disponibile dal telefono.
            </p>
          </Section>

          <Section title="Quando il microchip câ€™Ã¨ giÃ ">
            <p>
              Se lâ€™animale ha giÃ  il microchip, questo continua a mantenere il suo ruolo.
              UNIMALIA non lo sostituisce.
            </p>
            <p>
              Quello che aggiunge Ã¨ una gestione piÃ¹ ordinata e accessibile delle
              informazioni: dati utili, consultazione rapida, referti e organizzazione
              piÃ¹ semplice nel tempo.
            </p>
          </Section>

          <Section title="PerchÃ© questa distinzione Ã¨ utile">
            <p>
              Capire la differenza aiuta anche a capire il valore concreto del sistema:
              da una parte câ€™Ã¨ lâ€™identificazione, dallâ€™altra câ€™Ã¨ lâ€™organizzazione delle
              informazioni.
            </p>
            <p>
              In pratica, UNIMALIA non nasce per sostituire qualcosa di esistente, ma
              per creare un punto unico piÃ¹ ordinato, piÃ¹ accessibile e piÃ¹ utile nella
              vita quotidiana dellâ€™animale.
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
                  Cosâ€™Ã¨ lâ€™identitÃ  animale digitale
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
