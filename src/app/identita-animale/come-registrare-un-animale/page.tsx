import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import {
  buildIdentityBreadcrumbJsonLd,
  buildIdentityFaqJsonLd,
  buildIdentityPageMetadata,
  buildIdentityWebPageJsonLd,
} from "@/lib/seo/identityAnimal";

const pagePath = "/identita-animale/come-registrare-un-animale";
const pageTitle = "Come registrare un animale";
const pageDescription =
  "Guida pratica su come registrare un animale con UNIMALIA, quali dati preparare e perchÃ© tutti gli animali possono avere unâ€™identitÃ  animale digitale anche senza microchip.";

export const metadata: Metadata = buildIdentityPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const faqItems = [
  {
    question: "Quali dati servono per registrare un animale?",
    answer:
      "Di solito servono nome, specie, eventuale razza, foto recente e tutte le informazioni utili per riconoscerlo e gestirlo meglio nel tempo.",
  },
  {
    question: "Serve avere giÃ  il microchip?",
    answer:
      "No. Tutti gli animali possono avere unâ€™identitÃ  animale digitale, anche senza microchip.",
  },
  {
    question: "Cosa succede se lâ€™animale non ha il microchip?",
    answer:
      "Per gli animali senza microchip, UNIMALIA puÃ² assegnare unâ€™identitÃ  digitale con QR code e barcode, cosÃ¬ da creare un riferimento chiaro e sempre disponibile.",
  },
  {
    question: "Chi inserisce i dati sanitari piÃ¹ importanti?",
    answer:
      "I dati piÃ¹ utili possono essere inseriti dal veterinario, soprattutto se fa parte della Rete UNIMALIA, cosÃ¬ da avere informazioni piÃ¹ affidabili e aggiornate.",
  },
  {
    question: "PerchÃ© registrare un animale online?",
    answer:
      "Per avere una base unica, piÃ¹ ordinata e aggiornabile, utile nella gestione quotidiana e in situazioni delicate come smarrimenti o necessitÃ  improvvise.",
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

export default function ComeRegistrareAnimalePage() {
  const breadcrumbJsonLd = buildIdentityBreadcrumbJsonLd([
    { name: "Home", item: "https://unimalia.it/" },
    {
      name: "Come registrare un animale",
      item: "https://unimalia.it/identita-animale/come-registrare-un-animale",
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
        id="jsonld-registrare-animale-webpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <Script
        id="jsonld-registrare-animale-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id="jsonld-registrare-animale-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
            Guida identitÃ  animale
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Come registrare un animale
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Registrare un animale significa creare una base chiara e aggiornata delle
            informazioni piÃ¹ utili. Con UNIMALIA tutti gli animali possono avere
            unâ€™identitÃ  animale digitale, anche senza microchip, cosÃ¬ da avere un punto
            unico piÃ¹ ordinato e sempre disponibile quando serve.
          </p>
        </header>

        <div className="mt-8 grid gap-6">
          <Section title="Tutti gli animali possono essere registrati">
            <p>
              UNIMALIA non Ã¨ pensata solo per animali con microchip. Tutti gli animali
              possono avere unâ€™identitÃ  animale digitale.
            </p>
            <p>
              Per gli animali che non hanno microchip, UNIMALIA puÃ² assegnare
              unâ€™identitÃ  digitale con QR code e barcode, cosÃ¬ da creare un riferimento
              chiaro, consultabile e sempre disponibile dal telefono.
            </p>
          </Section>

          <Section title="Quali dati preparare">
            <ul className="list-disc space-y-2 pl-6">
              <li>nome dellâ€™animale</li>
              <li>specie</li>
              <li>eventuale razza</li>
              <li>foto recente</li>
              <li>elementi utili per riconoscerlo</li>
              <li>informazioni pratiche importanti da tenere ordinate</li>
            </ul>
          </Section>

          <Section title="PerchÃ© conviene farlo prima che serva">
            <p>
              Preparare in anticipo una scheda ordinata rende piÃ¹ semplice gestire
              situazioni quotidiane e momenti delicati, come smarrimenti, necessitÃ 
              improvvise o consultazioni rapide.
            </p>
            <p>
              Non solo in viaggio: anche durante una semplice passeggiata o quando sei
              fuori casa con il tuo animale, avere accesso rapido alle informazioni
              importanti dal telefono puÃ² essere molto utile.
            </p>
          </Section>

          <Section title="Il ruolo della Rete UNIMALIA">
            <p>
              Se il veterinario fa parte della <strong>Rete UNIMALIA</strong>, puÃ² usare
              questo sistema per inserire e condividere le informazioni utili in modo
              piÃ¹ semplice e organizzato.
            </p>
            <p>
              Questo aiuta ad avere dati piÃ¹ affidabili e aggiornati, soprattutto per la
              cartella clinica rapida e per i referti inviati tramite questo canale.
            </p>
          </Section>

          <Section title="Versione gratuita e Premium">
            <p>
              Anche nella versione gratuita UNIMALIA puÃ² offrire una base utile, compresa
              una cartella clinica rapida con le informazioni essenziali.
            </p>
            <p>
              Se il veterinario utilizza la Rete UNIMALIA, i referti possono arrivare via
              email anche a chi non ha Premium.
            </p>
            <p>
              Con Premium, oltre alla mail, puoi consultare una timeline completa e
              organizzata, con archivio clinico, storico, reminder e funzioni avanzate.
            </p>
          </Section>

          <Section title="Come aiuta UNIMALIA">
            <p>
              UNIMALIA permette di creare una base digitale unica, piÃ¹ chiara e piÃ¹
              facile da aggiornare. Questo riduce la frammentazione delle informazioni e
              rende piÃ¹ semplice consultarle o riutilizzarle quando serve davvero.
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

          <Section title="Passa allâ€™azione">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/identita/nuovo"
                className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
              >
                Crea identitÃ  animale
              </Link>
              <Link
                href="/identita-animale/microchip-vs-identita-digitale"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
              >
                Leggi il confronto
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
