import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { SEO_CITIES, getSeoCityBySlug } from "@/lib/seo/cities";
import {
  buildAbsoluteUrl,
  buildBreadcrumbJsonLd,
  buildDogLostCityMetadata,
  buildFaqJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/lostPets";

type PageProps = {
  params: Promise<{
    city: string;
  }>;
};

export async function generateStaticParams() {
  return SEO_CITIES.map((city) => ({
    city: city.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const city = getSeoCityBySlug(resolved.city);

  if (!city) {
    return {
      title: "Pagina non trovata",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildDogLostCityMetadata(city);
}

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

export default async function CaneSmarritoCityPage({ params }: PageProps) {
  const resolved = await params;
  const city = getSeoCityBySlug(resolved.city);

  if (!city) {
    notFound();
  }

  const pagePath = `/smarriti/cane-smarrito/${city.slug}`;
  const pageTitle = `Cane smarrito a ${city.name}: cosa fare subito`;
  const pageDescription = `Guida pratica su cosa fare se hai un cane smarrito a ${city.name}: passaggi immediati, errori da evitare, microchip, identità digitale animale e segnalazione tramite UNIMALIA.`;

  const faqItems = [
    {
      question: `Cosa scrivere in una segnalazione di cane smarrito a ${city.name}?`,
      answer:
        "Nome del cane, foto recente, zona precisa, data, ora, segni distintivi, eventuale collare o pettorina e contatto aggiornato.",
    },
    {
      question: "Il microchip basta da solo?",
      answer:
        "Il microchip è essenziale per l’identificazione ufficiale, ma non sostituisce una segnalazione chiara, leggibile e aggiornata.",
    },
    {
      question: "UNIMALIA serve anche se il cane ha già il microchip?",
      answer:
        "Sì. L’identità digitale animale e la gestione dello smarrimento aiutano a organizzare meglio le informazioni utili e ad aggiornarle più rapidamente.",
    },
    {
      question: "Posso aggiornare la segnalazione quando ricevo avvistamenti?",
      answer:
        "Sì. Aggiornare lo stato e le informazioni del caso è utile per evitare confusione e mantenere la ricerca ordinata.",
    },
  ];

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", item: buildAbsoluteUrl("/") },
    { name: "Smarriti", item: buildAbsoluteUrl("/smarrimenti") },
    { name: "Cane smarrito", item: buildAbsoluteUrl("/smarriti/cane-smarrito/firenze").replace("/firenze", "") },
    { name: city.name, item: buildAbsoluteUrl(pagePath) },
  ]);

  const faqJsonLd = buildFaqJsonLd(faqItems);
  const webPageJsonLd = buildWebPageJsonLd({
    path: pagePath,
    name: `${pageTitle} | UNIMALIA`,
    description: pageDescription,
  });

  return (
    <main className="bg-zinc-50">
      <Script
        id={`jsonld-cane-smarrito-${city.slug}-webpage`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <Script
        id={`jsonld-cane-smarrito-${city.slug}-breadcrumb`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id={`jsonld-cane-smarrito-${city.slug}-faq`}
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
              <Link href="/smarrimenti" className="hover:text-zinc-900">
                Smarrimenti
              </Link>
            </li>
            <li>/</li>
            <li className="text-zinc-700">{city.name}</li>
          </ol>
        </nav>

        <header className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
            Guida locale UNIMALIA
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Cane smarrito a {city.name}: cosa fare subito
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Se hai perso un cane a {city.name}, le prime ore sono decisive. Agire
            rapidamente, organizzare bene la ricerca e pubblicare una segnalazione
            chiara aumenta le possibilità di ritrovamento. UNIMALIA ti aiuta a
            segnalare l’animale smarrito, raccogliere le informazioni utili e rendere
            più immediata la consultazione dei dati dell’animale.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaButton href="/smarrimenti/nuovo">Pubblica smarrimento</CtaButton>
            <CtaButton href="/identita/nuovo" variant="secondary">
              Crea identità animale
            </CtaButton>
          </div>
        </header>

        <div className="mt-8 grid gap-6">
          <Section title={`Cosa fare subito se il tuo cane è sparito a ${city.name}`}>
            <p>
              La prima cosa da fare è tornare nel punto esatto in cui il cane è stato
              visto l’ultima volta. Molti cani spaventati restano nelle vicinanze,
              seguono percorsi conosciuti o si rifugiano in zone tranquille.
            </p>
            <p>
              Subito dopo conviene preparare una segnalazione completa con foto
              recente, nome del cane, zona precisa della scomparsa, data, ora, segni
              distintivi ed eventuale collare o pettorina.
            </p>
          </Section>

          <Section title={`Cane smarrito a ${city.name}: i 7 passaggi più utili`}>
            <ol className="space-y-4">
              <li>
                <strong>1. Torna subito nell’ultima zona vista.</strong> Controlla
                strade vicine, parcheggi, giardini, ingressi condominiali e aree verdi.
              </li>
              <li>
                <strong>2. Chiama il cane con calma.</strong> Se l’animale è spaventato,
                urla e inseguimenti possono peggiorare la situazione.
              </li>
              <li>
                <strong>3. Coinvolgi rapidamente le persone presenti.</strong> Passanti,
                negozianti, bar, portieri e residenti possono averlo visto.
              </li>
              <li>
                <strong>4. Prepara una segnalazione chiara.</strong> Foto leggibile,
                zona precisa e contatto immediato fanno la differenza.
              </li>
              <li>
                <strong>5. Pubblica la segnalazione su UNIMALIA.</strong> Ti aiuta a
                centralizzare i dati utili in modo ordinato.
              </li>
              <li>
                <strong>6. Verifica i dati identificativi disponibili.</strong> Microchip,
                segni distintivi e informazioni già pronte aiutano a muoversi meglio.
              </li>
              <li>
                <strong>7. Aggiorna rapidamente il caso.</strong> Se ricevi
                avvistamenti o il cane viene ritrovato, aggiorna subito la scheda.
              </li>
            </ol>
          </Section>

          <Section title="Come può aiutarti UNIMALIA">
            <p>
              UNIMALIA non sostituisce i canali ufficiali di identificazione, ma può
              aiutarti a gestire meglio la parte informativa e digitale dello
              smarrimento.
            </p>

            <ul className="list-disc space-y-2 pl-6">
              <li>crei e gestisci l’identità digitale del tuo animale</li>
              <li>pubblichi la segnalazione di smarrimento in modo ordinato</li>
              <li>mantieni centrali le informazioni utili</li>
              <li>rendi più rapida la consultazione dei dati dell’animale</li>
              <li>aggiorni più facilmente lo stato del caso</li>
            </ul>
          </Section>

          <Section title={`Dove cercare un cane smarrito a ${city.name}`}>
            <p>
              In una città come {city.name}, conviene concentrare la ricerca in modo
              pratico e non dispersivo:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>ultima area di avvistamento</li>
              <li>strade secondarie vicine</li>
              <li>parchi, giardini e aree verdi</li>
              <li>parcheggi, cortili e ingressi riparati</li>
              <li>percorsi abituali già fatti con il cane</li>
              <li>zone in cui il cane si sente normalmente sicuro</li>
            </ul>
            <p>
              Se il cane è molto spaventato, una ricerca metodica è spesso più utile di
              una ricerca ampia ma disordinata.
            </p>
          </Section>

          <Section title="Microchip e identità digitale: non sono la stessa cosa">
            <p>
              Il microchip è il riferimento ufficiale per l’identificazione del cane.
              L’identità digitale animale non lo sostituisce.
            </p>
            <p>
              L’identità digitale serve a rendere più accessibili e aggiornabili online
              le informazioni utili: dati essenziali, note pratiche, riferimenti rapidi
              e gestione del caso.
            </p>
            <p>
              In sintesi: il microchip identifica formalmente; l’identità digitale aiuta
              nella gestione pratica delle informazioni.
            </p>
          </Section>

          <Section title="Errori da evitare">
            <ul className="list-disc space-y-2 pl-6">
              <li>aspettare troppo prima di agire</li>
              <li>pubblicare poche informazioni</li>
              <li>usare una foto non recente o poco chiara</li>
              <li>scrivere una zona troppo generica</li>
              <li>lasciare un contatto non aggiornato</li>
            </ul>
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
                href="/smarriti/animale-smarrito-cosa-fare"
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:bg-zinc-100"
              >
                <p className="text-lg font-semibold text-zinc-900">
                  Animale smarrito: cosa fare
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Guida generale da consultare subito in caso di smarrimento.
                </p>
              </Link>

              <Link
                href="/smarrimenti"
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:bg-zinc-100"
              >
                <p className="text-lg font-semibold text-zinc-900">Smarrimenti attivi</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Vai all’area con gli annunci di smarrimento pubblicati su UNIMALIA.
                </p>
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}