import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { SEO_CITIES, getSeoCityBySlug } from "@/lib/seo/cities";

const SITE_URL = "https://www.unimalia.it";

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
      robots: { index: false, follow: false },
    };
  }

  const title = `Veterinario a ${city.name}: trova professionisti`;
  const description = `Trova veterinari a ${city.name}. Scopri professionisti del settore animale, servizi disponibili e come accedere alla piattaforma UNIMALIA.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/professionisti/veterinario/${city.slug}`,
    },
    openGraph: {
      title: `${title} | UNIMALIA`,
      description,
      url: `${SITE_URL}/professionisti/veterinario/${city.slug}`,
      siteName: "UNIMALIA",
      locale: "it_IT",
      type: "article",
      images: [`${SITE_URL}/logo-512.png`],
    },
  };
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
      <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
      <div className="mt-4 space-y-4 text-zinc-700">{children}</div>
    </section>
  );
}

export default async function VeterinarioCityPage({ params }: PageProps) {
  const resolved = await params;
  const city = getSeoCityBySlug(resolved.city);

  if (!city) notFound();

  const path = `/professionisti/veterinario/${city.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name: `Veterinario a ${city.name} | UNIMALIA`,
    description: `Trova veterinari a ${city.name} e scopri come funziona UNIMALIA.`,
    inLanguage: "it-IT",
  };

  return (
    <main className="bg-zinc-50">
      <Script
        id={`jsonld-veterinario-${city.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* HEADER */}
        <header className="rounded-3xl bg-white p-8 shadow-sm border border-zinc-200">
          <h1 className="text-4xl font-bold text-zinc-900">
            Veterinario a {city.name}
          </h1>

          <p className="mt-4 text-lg text-zinc-600">
            Se stai cercando un veterinario a {city.name}, UNIMALIA ti aiuta a
            orientarti tra i professionisti del settore animale e a gestire in modo
            piÃ¹ semplice le informazioni legate al tuo animale.
          </p>

          <div className="mt-6 flex gap-3 flex-wrap">
            <Link
              href="/professionisti"
              className="bg-zinc-900 text-white px-5 py-3 rounded-xl font-semibold"
            >
              Vai ai professionisti
            </Link>

            <Link
              href="/identita/nuovo"
              className="border px-5 py-3 rounded-xl font-semibold"
            >
              Crea identitÃ  animale
            </Link>
          </div>
        </header>

        {/* CONTENUTO */}
        <div className="mt-8 grid gap-6">
          <Section title={`Come trovare un veterinario a ${city.name}`}>
            <p>
              Quando cerchi un veterinario a {city.name}, Ã¨ importante valutare
              diversi aspetti: disponibilitÃ , tipologia di struttura, esperienza e
              possibilitÃ  di gestire in modo ordinato le informazioni dellâ€™animale.
            </p>

            <p>
              UNIMALIA nasce anche per semplificare questo processo, offrendo un punto
              di riferimento digitale per proprietari e professionisti.
            </p>
          </Section>

          <Section title="Cosa offre UNIMALIA">
            <ul className="list-disc pl-6 space-y-2">
              <li>gestione identitÃ  digitale animale</li>
              <li>accesso controllato ai dati</li>
              <li>supporto nella gestione clinica</li>
              <li>organizzazione piÃ¹ chiara delle informazioni</li>
              <li>riduzione della frammentazione tra strumenti diversi</li>
            </ul>
          </Section>

          <Section title="PerchÃ© Ã¨ importante centralizzare le informazioni">
            <p>
              Spesso i dati di un animale sono sparsi tra documenti, chat,
              appuntamenti e appunti personali. Questo crea confusione e perdita di
              tempo.
            </p>

            <p>
              UNIMALIA aiuta a creare un punto unico, ordinato e aggiornabile, utile
              sia per il proprietario sia per il professionista.
            </p>
          </Section>

          <Section title="Professionisti: come iscriversi">
            <p>
              Se sei un professionista del settore animale, puoi iscriverti
              direttamente su UNIMALIA tramite la piattaforma.
            </p>

            <p>
              Per informazioni, supporto o eventuali problemi tecnici, puoi scrivere a{" "}
              <strong>professionisti@unimalia.it</strong>.
            </p>
          </Section>

          <Section title="Domande frequenti">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">
                  UNIMALIA sostituisce il veterinario?
                </h3>
                <p>No, Ã¨ uno strumento di supporto e gestione.</p>
              </div>

              <div>
                <h3 className="font-semibold">
                  Posso usare UNIMALIA con il mio veterinario?
                </h3>
                <p>
                  SÃ¬, la piattaforma Ã¨ pensata anche per facilitare la collaborazione.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Supporto">
            <p>
              Hai trovato un problema o qualcosa che non funziona?
            </p>

            <p>
              â€¢ Professionisti: professionisti@unimalia.it <br />
              â€¢ Utenti: info@unimalia.it
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}