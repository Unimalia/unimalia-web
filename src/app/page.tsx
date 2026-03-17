import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
  description:
    "UNIMALIA aiuta proprietari e professionisti a gestire identità animale, accessi clinici controllati, consulti, smarrimenti, segnalazioni di animali trovati e lieti fine in modo semplice e affidabile.",
  alternates: {
    canonical: "https://www.unimalia.it/",
  },
  openGraph: {
    title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
    description:
      "Identità animale, accessi clinici controllati, consulti, smarrimenti, animali trovati e lieti fine: tutto in un unico ecosistema digitale.",
    url: "https://www.unimalia.it/",
    siteName: "UNIMALIA",
    images: ["/logo-512.png"],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
    description:
      "Identità animale, accessi clinici controllati, consulti, smarrimenti, animali trovati e lieti fine: tutto in un unico ecosistema digitale.",
    images: ["/logo-512.png"],
  },
};

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
      {children}
    </span>
  );
}

function PrimaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
    >
      {children}
    </Link>
  );
}

function SecondaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
    >
      {children}
    </Link>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="text-sm font-semibold text-teal-700">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-zinc-600">{description}</p>
      ) : null}
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{description}</p>
      <div className="mt-5">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-zinc-900 transition hover:text-teal-700"
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-bold text-white">
        {number}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>
    </div>
  );
}

function AudienceCard({
  title,
  description,
  bullets,
  href,
  cta,
}: {
  title: string;
  description: string;
  bullets: string[];
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-sm">
      <h3 className="text-xl font-semibold text-zinc-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{description}</p>
      <ul className="mt-5 space-y-3 text-sm text-zinc-700">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-zinc-900 transition hover:text-teal-700"
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-zinc-50">
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_30%),linear-gradient(to_bottom,white,rgba(250,250,250,1))]"
        />
        <Container>
          <div className="relative grid gap-12 py-14 sm:py-18 lg:grid-cols-12 lg:items-center lg:py-24">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap gap-2">
                <Badge>Identità animale</Badge>
                <Badge>Dati clinici controllati</Badge>
                <Badge>Smarrimenti</Badge>
                <Badge>Trovati / Avvistati</Badge>
                <Badge>Professionisti</Badge>
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
                La piattaforma per{" "}
                <span className="text-teal-700">identità animale, accessi clinici e segnalazioni utili</span>.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
                UNIMALIA aiuta proprietari e professionisti a gestire in modo semplice dati essenziali,
                accessi autorizzati, consulti, smarrimenti, segnalazioni di animali trovati o avvistati
                e casi conclusi con lieto fine.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryCTA href="/identita/nuovo">Crea identità animale</PrimaryCTA>
                <SecondaryCTA href="/smarrimenti">Ho perso un animale</SecondaryCTA>
                <SecondaryCTA href="/trovati">Ho trovato o avvistato un animale</SecondaryCTA>
              </div>

              <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Per i proprietari</p>
                  <p className="mt-2 text-sm font-medium text-zinc-900">
                    Identità digitale, QR code e strumenti rapidi quando serve agire subito.
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Per i veterinari</p>
                  <p className="mt-2 text-sm font-medium text-zinc-900">
                    Accessi clinici autorizzati, consulti e collaborazione più ordinata.
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Per altri professionisti</p>
                  <p className="mt-2 text-sm font-medium text-zinc-900">
                    Spazio in evoluzione per toelettatori, pet sitter, pensioni e addestratori.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">UNIMALIA</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Un ecosistema digitale pensato per essere chiaro, rapido e controllato.
                    </p>
                  </div>
                  <Image
                    src="/logo-main.png"
                    alt="Logo UNIMALIA"
                    width={92}
                    height={84}
                    className="h-16 w-auto"
                    priority
                  />
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-semibold text-zinc-900">Identità animale</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Scheda digitale con dati essenziali, QR e codici pronti all’uso.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-semibold text-zinc-900">Smarrimenti, trovati e avvistamenti</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Segnalazioni più ordinate per aiutare a ritrovare l’animale e raccogliere informazioni utili.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-semibold text-zinc-900">Cartella clinica e accessi</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Il proprietario autorizza, il veterinario lavora con dati pertinenti e tracciati.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">Messaggio chiave</p>
                  <p className="mt-2 text-sm leading-relaxed text-amber-800">
                    UNIMALIA non vuole complicare: vuole rendere più semplice trovare, riconoscere,
                    condividere e proteggere le informazioni giuste sull’animale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-zinc-50">
        <Container>
          <div className="py-16 sm:py-20">
            <SectionTitle
              eyebrow="Capire subito"
              title="Cosa puoi fare con UNIMALIA"
              description="La homepage deve spiegare il prodotto in pochi secondi. Queste sono le aree che contano davvero."
            />

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <FeatureCard
                title="Crea l’identità dell’animale"
                description="Raccogli i dati essenziali dell’animale in una scheda digitale chiara e sempre accessibile."
                href="/identita/nuovo"
                cta="Crea identità"
              />
              <FeatureCard
                title="Pubblica uno smarrimento"
                description="Segnala rapidamente un animale smarrito e centralizza le informazioni importanti."
                href="/smarrimenti/nuovo"
                cta="Pubblica smarrimento"
              />
              <FeatureCard
                title="Segnala un animale trovato o avvistato"
                description="Aiuta a raccogliere segnalazioni utili sul territorio in modo più ordinato e verificabile."
                href="/trovati/nuovo"
                cta="Pubblica segnalazione"
              />
              <FeatureCard
                title="Collabora con veterinari e professionisti"
                description="Concedi accessi controllati e prepara un ecosistema utile anche per altri operatori del settore animale."
                href="/professionisti"
                cta="Vai ai professionisti"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <Container>
          <div className="py-16 sm:py-20">
            <SectionTitle
              eyebrow="Per chi è"
              title="Percorsi distinti per proprietari, veterinari e altri professionisti"
              description="UNIMALIA funziona meglio quando il valore è immediato e il ruolo di ognuno è chiaro."
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <AudienceCard
                title="Per i proprietari"
                description="Uno spazio più ordinato per gestire identità, accessi e situazioni delicate senza perdere tempo."
                bullets={[
                  "Crei l’identità digitale dell’animale e tieni i dati essenziali in un unico posto.",
                  "Decidi tu chi può accedere alle informazioni cliniche e per quanto tempo.",
                  "Hai strumenti rapidi per smarrimenti, segnalazioni e rientri con lieto fine.",
                ]}
                href="/identita"
                cta="Apri area identità"
              />

              <AudienceCard
                title="Per i veterinari"
                description="Un flusso più pulito per accedere ai dati autorizzati, lavorare sulla cartella clinica e gestire consulti."
                bullets={[
                  "Richiedi accesso agli animali solo quando autorizzato dal proprietario.",
                  "Operi sulla cartella clinica con tracciabilità e ruoli più chiari.",
                  "Invii consulti e condividi eventi clinici in modo controllato.",
                ]}
                href="/professionisti"
                cta="Apri area veterinari"
              />

              <AudienceCard
                title="Per altri professionisti del settore animale"
                description="Uno spazio pensato per crescere anche oltre l’area clinica, mantenendo ruoli e funzioni ben distinti."
                bullets={[
                  "Toelettatori, pet sitter, pensioni e addestratori avranno strumenti dedicati al proprio lavoro.",
                  "Le attività non cliniche resteranno separate dalla cartella veterinaria.",
                  "L’obiettivo è favorire collaborazione, ordine e continuità tra servizi diversi.",
                ]}
                href="/servizi"
                cta="Scopri i servizi"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-zinc-50">
        <Container>
          <div className="py-16 sm:py-20">
            <SectionTitle
              eyebrow="Come funziona"
              title="Una logica semplice: prima prepari, poi reagisci meglio"
              description="UNIMALIA deve essere utile prima dell’emergenza, non solo durante."
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-4">
              <Step
                number="1"
                title="Crea la scheda"
                description="Inserisci i dati principali dell’animale e genera la sua identità digitale."
              />
              <Step
                number="2"
                title="Attiva strumenti e accessi"
                description="Usa QR e codici, poi concedi ai professionisti solo gli accessi necessari."
              />
              <Step
                number="3"
                title="Gestisci segnalazioni"
                description="In caso di smarrimento, ritrovamento o avvistamento hai già una base pronta e più ordinata."
              />
              <Step
                number="4"
                title="Chiudi con lieto fine"
                description="Quando il caso si risolve, le informazioni restano più chiare e utili anche dopo l’emergenza."
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container>
          <div className="py-16 sm:py-20">
            <div className="rounded-[2.5rem] border border-zinc-200 bg-[linear-gradient(135deg,rgba(20,184,166,0.06),white,rgba(245,158,11,0.08))] p-8 shadow-sm sm:p-10">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-teal-700">Chiusura forte</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                  In pochi secondi deve essere chiaro: UNIMALIA serve a proteggere meglio l’animale.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-zinc-600">
                  Identità digitale, accessi clinici controllati, consulti, smarrimenti, animali trovati,
                  avvistamenti e lieti fine: meno dispersione, più chiarezza, più fiducia tra proprietari e professionisti.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryCTA href="/identita/nuovo">Crea identità animale</PrimaryCTA>
                <SecondaryCTA href="/smarrimenti">Vai agli smarrimenti</SecondaryCTA>
                <SecondaryCTA href="/trovati">Vai a trovati / avvistati</SecondaryCTA>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}