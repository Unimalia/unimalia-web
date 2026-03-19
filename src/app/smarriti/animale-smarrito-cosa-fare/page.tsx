import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import {
  buildAbsoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildLostPetsGuideMetadata,
  buildWebPageJsonLd,
} from "@/lib/seo/lostPets";

export const metadata: Metadata = buildLostPetsGuideMetadata();

const faqItems = [
  {
    question: "Cosa fare subito se un animale si smarrisce?",
    answer:
      "Bisogna tornare subito nell’ultima zona vista, cercare con metodo, preparare una segnalazione chiara con foto e dati utili, e aggiornare rapidamente le informazioni raccolte.",
  },
  {
    question: "Il microchip basta da solo?",
    answer:
      "Il microchip è essenziale per l’identificazione ufficiale, ma non sostituisce una segnalazione chiara, aggiornata e facilmente consultabile.",
  },
  {
    question: "A cosa serve l’identità digitale animale in caso di smarrimento?",
    answer:
      "Serve a raccogliere e organizzare in modo più accessibile le informazioni utili sull’animale, facilitando gestione pratica, aggiornamenti e consultazione.",
  },
  {
    question: "UNIMALIA sostituisce i canali ufficiali?",
    answer:
      "No. UNIMALIA non sostituisce i canali ufficiali di identificazione o gestione, ma aiuta a organizzare meglio la parte informativa e digitale.",
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

export default function AnimaleSmarritoCosaFarePage() {
  const path = "/smarriti/animale-smarrito-cosa-fare";
  const pageTitle = "Animale smarrito: cosa fare subito";
  const pageDescription =
    "Guida pratica per capire cosa fare subito quando un animale si smarrisce, come organizzare la ricerca e come usare UNIMALIA per gestire meglio le informazioni utili.";

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", item: buildAbsoluteUrl("/") },
    { name: "Smarriti", item: buildAbsoluteUrl("/smarrimenti") },
    { name: "Animale smarrito: cosa fare", item: buildAbsoluteUrl(path) },
  ]);

  const faqJsonLd = buildFaqJsonLd(faqItems);
  const webPageJsonLd = buildWebPageJsonLd({
    path,
    name: `${pageTitle} | UNIMALIA`,
    description: pageDescription,
  });

  return (
    <main className="bg-zinc-50">
      <Script
        id="jsonld-animale-smarrito-webpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <Script
        id="jsonld-animale-smarrito-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id="jsonld-animale-smarrito-faq"
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
            <li className="text-zinc-700">Animale smarrito: cosa fare</li>
          </ol>
        </nav>

        <header className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
            Guida pratica UNIMALIA
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Animale smarrito: cosa fare subito
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Quando un animale si smarrisce, le prime ore contano molto. Muoversi in
            modo rapido ma ordinato, raccogliere bene le informazioni e pubblicare una
            segnalazione chiara aumenta le possibilità di ritrovamento. UNIMALIA aiuta
            a gestire in modo più semplice identità digitale animale, smarrimenti e dati
            utili da consultare rapidamente.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaButton href="/smarrimenti/nuovo">Pubblica smarrimento</CtaButton>
            <CtaButton href="/identita/nuovo" variant="secondary">
              Crea identità animale
            </CtaButton>
          </div>
        </header>

        <div className="mt-8 grid gap-6">
          <Section title="Cosa fare subito quando un animale si smarrisce">
            <p>
              La prima azione utile è tornare immediatamente nel punto esatto in cui
              l’animale è stato visto per l’ultima volta. Molti animali spaventati non
              vanno lontano nelle prime fasi: si nascondono, si fermano in zone
              tranquille o provano a tornare su percorsi abituali.
            </p>
            <p>
              Subito dopo conviene preparare una segnalazione completa con fotografia
              recente, data, orario, zona precisa, caratteristiche visibili, eventuale
              collare o pettorina e un contatto aggiornato.
            </p>
          </Section>

          <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">In sintesi</h2>

            <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-700">
              <li>quando un animale si smarrisce, le prime ore sono decisive</li>
              <li>serve una ricerca ordinata, non casuale</li>
              <li>una segnalazione chiara aumenta le possibilità di ritrovamento</li>
              <li>UNIMALIA aiuta a creare una scheda completa e pronta da condividere</li>
              <li>UNIMALIA riduce la frammentazione degli smarrimenti online</li>
            </ul>
          </section>

          <Section title="I 7 passaggi più utili">
            <ol className="space-y-4">
              <li>
                <strong>1. Torna nell’ultima zona vista.</strong> Controlla strade
                laterali, aree verdi, parcheggi, cortili, portoni e punti in cui
                l’animale potrebbe essersi nascosto.
              </li>
              <li>
                <strong>2. Cerca con metodo, non in modo casuale.</strong> Meglio una
                ricerca organizzata per area che una ricerca ampia ma dispersiva.
              </li>
              <li>
                <strong>3. Coinvolgi subito le persone presenti.</strong> Passanti,
                negozi, bar, addetti a parchi, portieri e residenti possono aver visto
                qualcosa di utile.
              </li>
              <li>
                <strong>4. Prepara una segnalazione chiara.</strong> Una scheda
                confusa, senza foto o senza posizione precisa, è molto meno efficace.
              </li>
              <li>
                <strong>5. Pubblica e aggiorna la segnalazione.</strong> I dati devono
                restare coerenti, leggibili e aggiornati se arrivano nuovi avvistamenti.
              </li>
              <li>
                <strong>6. Verifica quali dati identificativi hai già pronti.</strong>{" "}
                Microchip, foto, nome, segni distintivi e recapiti aiutano a reagire
                più velocemente.
              </li>
              <li>
                <strong>7. Chiudi o aggiorna il caso appena cambia la situazione.</strong>{" "}
                Tenere aggiornata la scheda evita errori, informazioni vecchie e
                dispersione.
              </li>
            </ol>
          </Section>

          <Section title="Come aiuta UNIMALIA contro la frammentazione degli smarrimenti online">
            <p>
              Quando un animale si perde, le informazioni finiscono spesso sparse tra
              gruppi Facebook, chat, bacheche locali, portali e messaggi privati.
              Questo crea confusione, duplicazioni e perdita di tempo proprio quando
              servirebbe il massimo ordine.
            </p>
            <p>
              UNIMALIA nasce anche per ridurre questa frammentazione: puoi creare qui
              una scheda di smarrimento completa, ordinata e già pronta da usare come
              base per tutte le altre pubblicazioni.
            </p>
            <p>
              In pratica, compili una volta sola le informazioni essenziali e poi puoi
              copiarle e riutilizzarle dove vuoi. In questo senso UNIMALIA può diventare
              un vero ponte tra i diversi canali online e un punto unico di riferimento
              per gestire meglio il caso.
            </p>
            <p>
              Questo significa meno confusione, meno duplicazioni e una gestione più
              efficace delle informazioni proprio nel momento in cui ogni dettaglio può
              fare la differenza.
            </p>
          </Section>

          <Section title="Come aiuta UNIMALIA">
            <p>
              UNIMALIA non sostituisce i canali ufficiali di identificazione, ma aiuta
              nella parte pratica e digitale della gestione delle informazioni.
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>puoi creare l’identità digitale animale</li>
              <li>puoi raccogliere i dati essenziali in una scheda ordinata</li>
              <li>puoi pubblicare uno smarrimento in modo più chiaro</li>
              <li>puoi aggiornare più facilmente lo stato del caso</li>
              <li>puoi usare la scheda come base pronta da condividere altrove</li>
              <li>
                puoi rendere più immediata la consultazione delle informazioni utili
              </li>
            </ul>
          </Section>

          <Section title="Microchip e identità digitale: differenza reale">
            <p>
              Il microchip è il riferimento ufficiale di identificazione dell’animale.
              L’identità digitale animale non lo sostituisce.
            </p>
            <p>
              L’identità digitale serve invece a raccogliere, organizzare e rendere più
              accessibili online le informazioni utili: dati essenziali, note pratiche,
              collegamenti rapidi e aggiornamenti.
            </p>
            <p>
              In pratica, il microchip identifica formalmente; l’identità digitale aiuta
              nella gestione pratica delle informazioni e nella rapidità d’azione.
            </p>
          </Section>

          <Section title="Errori da evitare">
            <ul className="list-disc space-y-2 pl-6">
              <li>aspettare troppo prima di iniziare una ricerca organizzata</li>
              <li>pubblicare foto vecchie o poco leggibili</li>
              <li>indicare una zona troppo vaga</li>
              <li>lasciare un contatto non aggiornato o difficile da raggiungere</li>
              <li>non aggiornare la segnalazione quando arrivano novità</li>
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
                href="/smarriti/cane-smarrito/firenze"
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:bg-zinc-100"
              >
                <p className="text-lg font-semibold text-zinc-900">
                  Cane smarrito a Firenze
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Esempio di guida local ottimizzata per query territoriali.
                </p>
              </Link>

              <Link
                href="/identita-animale/cos-e-identita-animale-digitale"
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:bg-zinc-100"
              >
                <p className="text-lg font-semibold text-zinc-900">
                  Cos’è l’identità animale digitale
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Guida dedicata al significato e all’utilità dell’identità digitale animale.
                </p>
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}