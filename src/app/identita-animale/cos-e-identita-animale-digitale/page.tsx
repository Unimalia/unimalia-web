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
const pageTitle = "Cosâ€™Ã¨ lâ€™identitÃ  animale digitale";
const pageDescription =
  "Scopri cosâ€™Ã¨ lâ€™identitÃ  animale digitale, a cosa serve, perchÃ© puÃ² essere utile per tutti gli animali anche senza microchip e come funziona in UNIMALIA.";

export const metadata: Metadata = buildIdentityPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const faqItems = [
  {
    question: "Cosâ€™Ã¨ lâ€™identitÃ  animale digitale?",
    answer:
      "Ãˆ una scheda digitale che raccoglie e organizza le informazioni utili di un animale in modo piÃ¹ accessibile, aggiornabile e consultabile online.",
  },
  {
    question: "Serve solo agli animali con microchip?",
    answer:
      "No. Tutti gli animali possono avere unâ€™identitÃ  animale digitale, anche quelli che non hanno microchip.",
  },
  {
    question: "Cosa succede se lâ€™animale non ha il microchip?",
    answer:
      "Per gli animali senza microchip, UNIMALIA puÃ² assegnare unâ€™identitÃ  digitale con QR code e barcode, cosÃ¬ da creare un riferimento chiaro e sempre disponibile.",
  },
  {
    question: "A cosa serve concretamente?",
    answer:
      "Serve a raccogliere dati essenziali, avere un punto unico piÃ¹ ordinato, migliorare la gestione pratica dellâ€™animale e rendere piÃ¹ semplice la consultazione delle informazioni utili.",
  },
  {
    question: "Che differenza câ€™Ã¨ tra Free e Premium?",
    answer:
      "Con la versione gratuita puoi avere una base utile, compresa una cartella clinica rapida e i referti via email tramite la Rete UNIMALIA. Con Premium puoi consultare una timeline completa e organizzata, storico clinico, reminder e funzioni avanzate.",
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
    { name: "Home", item: "https://unimalia.it/" },
    {
      name: "Cosâ€™Ã¨ lâ€™identitÃ  animale digitale",
      item: "https://unimalia.it/identita-animale/cos-e-identita-animale-digitale",
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
            <li className="text-zinc-700">Cosâ€™Ã¨ lâ€™identitÃ  animale digitale</li>
          </ol>
        </nav>

        <header className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
            Guida identitÃ  animale
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Cosâ€™Ã¨ lâ€™identitÃ  animale digitale
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Lâ€™identitÃ  animale digitale Ã¨ un modo piÃ¹ ordinato per raccogliere e gestire
            online le informazioni utili di un animale. Ãˆ pensata per tutti gli animali,
            anche per quelli che non hanno microchip, e aiuta ad avere un punto unico,
            piÃ¹ chiaro e piÃ¹ facile da consultare nel tempo.
          </p>
        </header>

        <div className="mt-8 grid gap-6">
          <Section title="Definizione semplice">
            <p>
              Lâ€™identitÃ  animale digitale Ã¨ una scheda online che raccoglie in modo
              strutturato i dati principali di un animale: informazioni essenziali,
              elementi utili per riconoscerlo, dati sanitari importanti e altri contenuti
              consultabili in modo piÃ¹ semplice e ordinato.
            </p>
          </Section>

          <Section title="Ãˆ pensata per tutti gli animali">
            <p>
              UNIMALIA non Ã¨ pensata solo per gli animali che hanno giÃ  il microchip.
              Tutti gli animali possono avere unâ€™identitÃ  animale digitale, anche gatti o
              altri animali che non ne sono provvisti.
            </p>
            <p>
              Per gli animali senza microchip, UNIMALIA puÃ² assegnare unâ€™identitÃ  digitale
              con QR code e barcode, cosÃ¬ da creare un riferimento chiaro, consultabile e
              sempre disponibile dal telefono.
            </p>
          </Section>

          <Section title="A cosa serve davvero">
            <ul className="list-disc space-y-2 pl-6">
              <li>tenere in ordine i dati essenziali dellâ€™animale</li>
              <li>avere una base unica, piÃ¹ chiara e aggiornabile nel tempo</li>
              <li>rendere piÃ¹ semplice la gestione pratica delle informazioni</li>
              <li>avere dati utili sempre disponibili in caso di necessitÃ </li>
              <li>ridurre la dispersione tra documenti, email, note e strumenti diversi</li>
            </ul>
          </Section>

          <Section title="Cartella clinica rapida e funzioni avanzate">
            <p>
              Anche nella versione gratuita, UNIMALIA puÃ² offrire una cartella clinica
              rapida con le informazioni essenziali utili soprattutto in caso di
              emergenza.
            </p>
            <p>
              Se il veterinario fa parte della <strong>Rete UNIMALIA</strong>, i referti
              possono essere inviati tramite questo canale anche a chi non ha Premium:
              in quel caso il cliente li riceve via email.
            </p>
            <p>
              Chi ha Premium, oltre alla mail, puÃ² consultare una timeline completa e
              organizzata, con archivio clinico, storico, reminder e funzioni avanzate.
            </p>
          </Section>

          <Section title="PerchÃ© puÃ² essere utile ogni giorno">
            <p>
              Spesso le informazioni su un animale sono disperse tra documenti, messaggi,
              foto, email e note personali. Lâ€™identitÃ  digitale aiuta a ridurre questa
              frammentazione e a creare un punto unico piÃ¹ ordinato e piÃ¹ facile da
              aggiornare.
            </p>
            <p>
              Non solo in viaggio: anche durante una semplice passeggiata o quando sei
              fuori casa con il tuo animale, avere accesso rapido alle informazioni
              importanti dal telefono puÃ² essere utile in caso di bisogno.
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
                  Microchip vs identitÃ  digitale
                </p>
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
