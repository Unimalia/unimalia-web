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
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 shadow-sm">
      {children}
    </span>
  );
}

function PrimaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="btn btn-primary">
      {children}
    </Link>
  );
}

function SecondaryCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="btn btn-secondary">
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
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}

function ActionCard({
  index,
  title,
  description,
  href,
  cta,
}: {
  index: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="card card-hover block p-6 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Azione {index}
        </span>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-bold text-white">
          {index}
        </span>
      </div>
      <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">{description}</p>
      <div className="mt-6 inline-flex items-center text-sm font-semibold text-zinc-900 transition hover:text-teal-700">
        {cta} →
      </div>
    </Link>
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
    <div className="card p-6 sm:p-7">
      <h3 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">{description}</p>
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
    <div className="card p-6">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-bold text-white">
        {number}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{description}</p>
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
    <div className="card p-7">
      <h3 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">{description}</p>
      <ul className="mt-6 space-y-3 text-sm leading-relaxed text-zinc-700">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-zinc-900 transition hover:text-teal-700"
        >
          {cta} →
        </Link>
        <Link href="/prezzi" className="text-sm text-zinc-600 hover:text-zinc-900">
          Prezzi
        </Link>
      </div>
    </div>
  );
}

function GuideCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="card card-hover block p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Guida</p>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{description}</p>
      <div className="mt-6 text-sm font-semibold text-zinc-900">Apri guida →</div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="bg-zinc-50">
      <section className="bg-hero relative overflow-hidden border-b border-zinc-200">
        <Container>
          <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:items-end lg:gap-10 lg:py-24">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap gap-2">
                <Badge>Identità animale</Badge>
                <Badge>Dati clinici controllati</Badge>
                <Badge>Smarrimenti</Badge>
                <Badge>Trovati / Avvistati</Badge>
                <Badge>Professionisti</Badge>
              </div>

              <h1 className="mt-7 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-zinc-900 sm:text-5xl lg:text-6xl">
                Un modo più moderno per proteggere il tuo animale e agire subito quando serve.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
                UNIMALIA unisce identità animale digitale, segnalazioni rapide, accessi controllati
                e collaborazione con professionisti in un’esperienza più chiara, ordinata e utile.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryCTA href="/identita/nuovo">Crea identità animale</PrimaryCTA>
                <SecondaryCTA href="/smarrimenti/nuovo">Segnala smarrimento</SecondaryCTA>
                <SecondaryCTA href="/trovati/nuovo">Segnala trovato o avvistato</SecondaryCTA>
              </div>

              <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Per i proprietari
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-900">
                    Dati essenziali, QR code e strumenti rapidi sempre pronti.
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Per i veterinari
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-900">
                    Accessi autorizzati, consulti e lavoro clinico più ordinato.
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Per il territorio
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-900">
                    Smarrimenti e segnalazioni più chiare, condivisibili e utili.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="card overflow-hidden p-0">
                <div className="accent-teal h-1.5 w-full" />
                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="max-w-xs">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Ecosistema UNIMALIA
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
                        Chiaro quando tutto intorno è disperso.
                      </h2>
                    </div>
                    <Image
                      src="/logo-main.png"
                      alt="Logo UNIMALIA"
                      width={92}
                      height={84}
                      className="h-16 w-auto shrink-0"
                      priority
                    />
                  </div>

                  <div className="mt-7 grid gap-3">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-zinc-900">Identità digitale</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                        Una scheda chiara con dati essenziali, QR e strumenti utili già pronti.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-zinc-900">Emergenza e territorio</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                        Smarrimenti, trovati e avvistamenti raccolti in modo più ordinato.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-zinc-900">Collaborazione clinica</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                        Accessi controllati, consulti e continuità migliore tra owner e veterinari.
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-900">
                      Messaggio chiave
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-amber-800">
                      UNIMALIA rende più semplice riconoscere, proteggere e condividere le
                      informazioni giuste sull’animale, nel momento giusto.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-4 text-sm">
                    <Link
                      href="/professionisti"
                      className="font-semibold text-zinc-900 hover:text-teal-700"
                    >
                      Area professionisti →
                    </Link>
                    <Link href="/prezzi" className="text-zinc-600 hover:text-zinc-900">
                      Prezzi
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-12">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            <ActionCard
              index="1"
              title="Crea l’identità animale"
              description="Parti da una base chiara: dati essenziali, QR code e strumenti pronti all’uso."
              href="/identita/nuovo"
              cta="Inizia ora"
            />
            <ActionCard
              index="2"
              title="Hai perso un animale?"
              description="Pubblica subito una segnalazione ordinata per muoverti in modo più rapido e concreto."
              href="/smarrimenti/nuovo"
              cta="Segnala smarrimento"
            />
            <ActionCard
              index="3"
              title="Hai trovato o avvistato un animale?"
              description="Invia una segnalazione utile per facilitare il ricongiungimento e raccogliere informazioni."
              href="/trovati/nuovo"
              cta="Segnala ora"
            />
          </div>
        </Container>
      </section>

      <section className="pb-12 sm:pb-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="card h-full p-8 sm:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                  Perché nasce
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                  Quando le informazioni sono sparse, agire bene diventa più difficile.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
                  Email, carta, messaggi, referti e dettagli salvati in posti diversi rallentano
                  tutto. UNIMALIA nasce per creare una base unica più chiara, prima dell’emergenza
                  e durante l’emergenza.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="card h-full overflow-hidden p-0">
                <div className="accent-amber h-1.5 w-full" />
                <div className="grid gap-3 p-6 sm:p-7">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                    ✔ Dati essenziali più ordinati
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                    ✔ Strumenti rapidi quando serve agire
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                    ✔ Più chiarezza tra proprietari e professionisti
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                    ✔ Meno dispersione, più continuità
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-soft py-14 sm:py-16">
        <Container>
          <SectionTitle
            eyebrow="Cosa puoi fare"
            title="Un’esperienza pensata per orientare subito l’utente"
            description="La home non deve raccontare tutto: deve far capire in pochi secondi quali sono le azioni principali e perché servono."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              title="Crea l’identità dell’animale"
              description="Raccogli i dati essenziali in una scheda digitale chiara, più semplice da consultare e riutilizzare."
              href="/identita/nuovo"
              cta="Crea identità"
            />
            <FeatureCard
              title="Pubblica uno smarrimento"
              description="Centralizza subito le informazioni importanti e rendi la ricerca più ordinata."
              href="/smarrimenti/nuovo"
              cta="Pubblica smarrimento"
            />
            <FeatureCard
              title="Segnala trovato o avvistato"
              description="Aiuta a raccogliere segnalazioni utili sul territorio in modo più verificabile e leggibile."
              href="/trovati/nuovo"
              cta="Pubblica segnalazione"
            />
            <FeatureCard
              title="Collabora con professionisti"
              description="Concedi accessi controllati e prepara una continuità migliore con veterinari e operatori del settore."
              href="/professionisti"
              cta="Vai ai professionisti"
            />
          </div>
        </Container>
      </section>

      <section className="border-y border-zinc-200 bg-white py-14 sm:py-16">
        <Container>
          <SectionTitle
            eyebrow="Per chi è"
            title="Percorsi distinti, linguaggio chiaro, ruoli ben separati"
            description="UNIMALIA funziona meglio quando ogni utente capisce subito il proprio spazio, il proprio ruolo e l’azione giusta da fare."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <AudienceCard
              title="Per i proprietari"
              description="Uno spazio più ordinato per gestire identità, accessi e momenti delicati senza perdere tempo."
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
              title="Per altri professionisti"
              description="Uno spazio pensato per crescere oltre l’area clinica, mantenendo funzioni e responsabilità ben distinte."
              bullets={[
                "Toelettatori, pet sitter, pensioni e addestratori avranno strumenti dedicati al proprio lavoro.",
                "Le attività non cliniche resteranno separate dalla cartella veterinaria.",
                "L’obiettivo è favorire collaborazione, ordine e continuità tra servizi diversi.",
              ]}
              href="/servizi"
              cta="Scopri i servizi"
            />
          </div>
        </Container>
      </section>

      <section className="bg-zinc-50 py-14 sm:py-16">
        <Container>
          <SectionTitle
            eyebrow="Come funziona"
            title="Prima prepari una base chiara, poi reagisci meglio"
            description="UNIMALIA deve essere utile prima dell’emergenza, durante l’emergenza e anche dopo."
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
              description="In caso di smarrimento, ritrovamento o avvistamento hai già una base più pronta e ordinata."
            />
            <Step
              number="4"
              title="Chiudi con lieto fine"
              description="Quando il caso si risolve, le informazioni restano più chiare e utili anche dopo."
            />
          </div>
        </Container>
      </section>

      <section className="border-y border-zinc-200 bg-white py-14 sm:py-16">
        <Container>
          <SectionTitle
            eyebrow="Guide utili"
            title="Risorse pubbliche per capire subito cosa fare"
            description="Guide pratiche che aiutano gli utenti a orientarsi meglio e rendono più forte anche la presenza organica di UNIMALIA."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <GuideCard
              title="Animale smarrito: cosa fare subito"
              description="Guida pratica con passaggi immediati, errori da evitare e uso corretto di identità digitale e segnalazione."
              href="/smarriti/animale-smarrito-cosa-fare"
            />
            <GuideCard
              title="Cane smarrito a Firenze"
              description="Prima pagina local costruita per query territoriali come “cane smarrito Firenze”."
              href="/smarriti/cane-smarrito/firenze"
            />
            <GuideCard
              title="Smarrimenti attivi"
              description="Vai alla sezione pubblica con le segnalazioni attive pubblicate sulla piattaforma."
              href="/smarrimenti"
            />
          </div>
        </Container>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <Container>
          <div className="card overflow-hidden p-0">
            <div className="accent-teal h-1.5 w-full" />
            <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                  Chiusura
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                  UNIMALIA serve a rendere più semplice proteggere l’animale, nel momento in cui
                  conta davvero.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">
                  Identità digitale, accessi clinici controllati, consulti, smarrimenti, animali
                  trovati, avvistamenti e lieti fine: meno dispersione, più chiarezza, più fiducia.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <PrimaryCTA href="/identita/nuovo">Crea identità animale</PrimaryCTA>
                <SecondaryCTA href="/smarrimenti/nuovo">Segnala smarrimento</SecondaryCTA>
                <SecondaryCTA href="/trovati/nuovo">Segnala trovato o avvistato</SecondaryCTA>
                <Link href="/prezzi" className="pt-2 text-sm text-zinc-600 hover:text-zinc-900">
                  Prezzi
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}