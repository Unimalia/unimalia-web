import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { SEO_CITIES, getSeoCityBySlug } from "@/lib/seo/cities";
import {
  buildAbsoluteUrl,
  buildBreadcrumbJsonLd,
  buildCatLostCityMetadata,
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

  return buildCatLostCityMetadata(city);
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

export default async function GattoSmarritoCityPage({ params }: PageProps) {
  const resolved = await params;
  const city = getSeoCityBySlug(resolved.city);

  if (!city) {
    notFound();
  }

  const pagePath = `/smarriti/gatto-smarrito/${city.slug}`;
  const pageTitle = `Gatto smarrito a ${city.name}: cosa fare subito`;
  const pageDescription = `Guida pratica su cosa fare se hai un gatto smarrito a ${city.name}: passaggi immediati, errori da evitare, microchip, identità digitale animale e segnalazione tramite UNIMALIA.`;

  const faqItems = [
    {
      question: `Cosa scrivere in una segnalazione di gatto smarrito a ${city.name}?`,
      answer:
        "Nome del gatto, foto recente, zona precisa, data, ora, segni distintivi, eventuale collare e contatto aggiornato.",
    },
    {
      question: "Un gatto smarrito resta vicino a casa?",
      answer:
        "Molti gatti, soprattutto se spaventati, tendono a nascondersi molto vicino al punto di scomparsa nelle prime ore o nei primi giorni.",
    },
    {
      question: "UNIMALIA serve anche se il gatto ha già il microchip?",
      answer:
        "Sì. Il microchip resta fondamentale per l’identificazione ufficiale, ma UNIMALIA aiuta a raccogliere e organizzare meglio le informazioni pratiche dello smarrimento.",
    },
    {
      question: "Posso aggiornare la segnalazione quando ricevo nuovi avvistamenti?",
      answer:
        "Sì. Aggiornare lo stato del caso aiuta a mantenere ordine e coerenza in tutte le informazioni diffuse online.",
    },
  ];

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", item: buildAbsoluteUrl("/") },
    { name: "Smarriti", item: buildAbsoluteUrl("/smarrimenti") },
    { name: "Gatto smarrito", item: buildAbsoluteUrl("/smarriti/gatto-smarrito") },
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
        id={`jsonld-gatto-smarrito-${city.slug}-webpage`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <Script
        id={`jsonld-gatto-smarrito-${city.slug}-breadcrumb`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id={`jsonld-gatto-smarrito-${city.slug}-faq`}
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
            Gatto smarrito a {city.name}: cosa fare subito
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Se hai perso un gatto a {city.name}, è importante muoversi subito ma con
            metodo. Molti gatti spaventati si nascondono molto vicino al punto di
            scomparsa, quindi una ricerca precisa e una segnalazione chiara possono fare
            la differenza. UNIMALIA ti aiuta a raccogliere le informazioni utili e a
            gestire meglio lo smarrimento.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaButton href="/smarrimenti/nuovo">Pubblica smarrimento</CtaButton>
            <CtaButton href="/identita/nuovo" variant="secondary">
              Crea identità animale
            </CtaButton>
          </div>
        </header>

        <div className="mt-8 grid gap-6">
          <Section title={`Cosa fare subito se il tuo gatto è sparito a ${city.name}`}>
            <p>
              La prima cosa utile è controllare con attenzione l’area immediatamente
              vicina al punto in cui il gatto è stato visto l’ultima volta. Molti gatti
              non si allontanano molto, ma restano nascosti in luoghi silenziosi e
              riparati.
            </p>
            <p>
              Conviene preparare subito una segnalazione completa con foto recente, zona
              precisa, data, ora, segni distintivi e recapito aggiornato.
            </p>
          </Section>

          <Section title={`Gatto smarrito a ${city.name}: i passaggi più utili`}>
            <ol className="space-y-4">
              <li>
                <strong>1. Cerca prima molto vicino.</strong> Controlla garage, giardini,
                cortili, siepi, scale, cantine, auto parcheggiate e punti riparati.
              </li>
              <li>
                <strong>2. Procedi con calma.</strong> I rumori forti possono spaventare
                ancora di più un gatto già nascosto.
              </li>
              <li>
                <strong>3. Chiedi rapidamente in zona.</strong> Residenti, negozi e
                vicinato possono aver notato movimenti o miagolii.
              </li>
              <li>
                <strong>4. Prepara una segnalazione leggibile.</strong> Foto chiara, zona
                precisa e descrizione essenziale aiutano molto.
              </li>
              <li>
                <strong>5. Usa UNIMALIA come base unica.</strong> La scheda può aiutarti
                a mantenere ordine tra i diversi canali di condivisione.
              </li>
              <li>
                <strong>6. Verifica i dati identificativi.</strong> Microchip, nome, foto
                e segni distintivi devono essere pronti subito.
              </li>
              <li>
                <strong>7. Aggiorna la situazione.</strong> Nuovi avvistamenti o ritrovamento
                vanno registrati rapidamente per evitare confusione.
              </li>
            </ol>
          </Section>

          <Section title="UNIMALIA come ponte contro la frammentazione">
            <p>
              Anche nel caso dei gatti smarriti, le informazioni finiscono spesso sparse
              tra gruppi social, chat locali, bacheche e passaparola.
            </p>
            <p>
              UNIMALIA ti aiuta a creare una scheda ordinata e completa da usare come
              base pronta per tutte le altre condivisioni. In questo modo hai un punto
              unico da cui partire, aggiornare il caso e mantenere coerenza nelle
              informazioni diffuse altrove.
            </p>
          </Section>

          <Section title={`Dove cercare un gatto smarrito a ${city.name}`}>
            <ul className="list-disc space-y-2 pl-6">
              <li>nelle immediate vicinanze dell’ultimo punto visto</li>
              <li>in zone riparate e silenziose</li>
              <li>in cortili, garage, cantine e sotto auto</li>
              <li>vicino a casa o a percorsi abituali</li>
              <li>in punti dove il gatto può sentirsi nascosto e protetto</li>
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
                  Guida generale per agire rapidamente in caso di smarrimento.
                </p>
              </Link>

              <Link
                href="/smarrimenti"
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:bg-zinc-100"
              >
                <p className="text-lg font-semibold text-zinc-900">Smarrimenti attivi</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Vai all’area pubblica degli smarrimenti su UNIMALIA.
                </p>
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}