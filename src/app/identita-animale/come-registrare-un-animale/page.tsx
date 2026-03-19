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
  "Guida pratica su come registrare un animale in modo ordinato, quali dati preparare e come creare un’identità animale digitale con UNIMALIA.";

export const metadata: Metadata = buildIdentityPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const faqItems = [
  {
    question: "Quali dati servono per registrare un animale?",
    answer:
      "Di solito servono nome, specie, eventuale razza, foto, dati identificativi disponibili e altre informazioni utili per riconoscerlo e gestirlo meglio.",
  },
  {
    question: "Serve avere già il microchip?",
    answer:
      "Il microchip è molto importante quando presente, ma la registrazione digitale aiuta soprattutto a organizzare e rendere più accessibili le informazioni utili.",
  },
  {
    question: "Perché registrare un animale online?",
    answer:
      "Per avere una base unica, ordinata e aggiornabile, utile nella gestione quotidiana e in situazioni delicate come smarrimenti o accessi autorizzati.",
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
    { name: "Home", item: "https://www.unimalia.it/" },
    { name: "Come registrare un animale", item: "https://www.unimalia.it/identita-animale/come-registrare-un-animale" },
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
            Guida identità animale
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Come registrare un animale
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Registrare un animale in modo ordinato significa creare una base chiara e
            aggiornata delle informazioni più utili. Con UNIMALIA puoi partire da una
            scheda digitale che aiuta a ridurre dispersione, confusione e perdita di
            tempo quando serve agire rapidamente.
          </p>
        </header>

        <div className="mt-8 grid gap-6">
          <Section title="Quali dati preparare">
            <ul className="list-disc space-y-2 pl-6">
              <li>nome dell’animale</li>
              <li>specie</li>
              <li>eventuale razza</li>
              <li>foto recente</li>
              <li>elementi identificativi utili</li>
              <li>dati disponibili come microchip o note pratiche</li>
            </ul>
          </Section>

          <Section title="Perché conviene farlo prima che serva">
            <p>
              Preparare in anticipo una scheda ordinata rende più semplice gestire
              situazioni come smarrimenti, accessi autorizzati, consultazioni rapide e
              aggiornamenti nel tempo.
            </p>
          </Section>

          <Section title="Come aiuta UNIMALIA">
            <p>
              UNIMALIA ti permette di creare una base digitale unica, più chiara e più
              facile da aggiornare. Questo riduce la frammentazione delle informazioni e
              rende più semplice riutilizzarle quando serve.
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

          <Section title="Passa all’azione">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/identita/nuovo"
                className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
              >
                Crea identità animale
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