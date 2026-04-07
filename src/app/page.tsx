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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/5 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function PrimaryCTA({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800"
    >
      {children}
    </Link>
  );
}

function SecondaryCTA({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-50"
    >
      {children}
    </Link>
  );
}

function SectionIntro({
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function FeatureCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
      <h3 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">{text}</p>
    </div>
  );
}

function QuickActionCard({
  number,
  title,
  text,
  href,
  cta,
}: {
  number: string;
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-[2rem] border border-black/5 bg-white p-7 shadow-[0_14px_40px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Azione {number}
        </p>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
          {number}
        </div>
      </div>

      <h3 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">{text}</p>
      <div className="mt-8 text-sm font-semibold text-zinc-900 transition group-hover:text-teal-700">
        {cta} →
      </div>
    </Link>
  );
}

function AudienceCard({
  title,
  text,
  bullets,
  href,
  cta,
}: {
  title: string;
  text: string;
  bullets: string[];
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
      <h3 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">{text}</p>

      <ul className="mt-6 space-y-3 text-sm leading-relaxed text-zinc-700">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
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

function TimelineStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
        {number}
      </div>
      <h3 className="mt-6 text-xl font-semibold text-zinc-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{text}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden rounded-[2.5rem] border border-black/5 bg-white px-6 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.05)] sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_28%),linear-gradient(to_bottom,rgba(255,251,235,0.78),rgba(255,255,255,1))]"
        />

        <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap gap-2">
              <Badge>Identità animale</Badge>
              <Badge>Smarrimenti</Badge>
              <Badge>Trovati / Avvistati</Badge>
              <Badge>Dati clinici controllati</Badge>
            </div>

            <h1 className="mt-8 max-w-5xl text-4xl font-semibold tracking-[-0.06em] text-zinc-900 sm:text-6xl lg:text-7xl">
              La piattaforma digitale per proteggere l’animale in modo più moderno.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
              UNIMALIA unisce identità animale, segnalazioni sul territorio, accessi clinici
              controllati e collaborazione con professionisti in un’esperienza più chiara, più
              uniforme e più utile quando serve davvero.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryCTA href="/identita/nuovo">Crea identità animale</PrimaryCTA>
              <SecondaryCTA href="/smarrimenti/nuovo">Segnala smarrimento</SecondaryCTA>
              <SecondaryCTA href="/trovati/nuovo">Segnala trovato o avvistato</SecondaryCTA>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-white/85 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-semibold tracking-tight text-zinc-900">1 base</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  Un unico punto di partenza più ordinato per dati e strumenti.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/85 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-semibold tracking-tight text-zinc-900">+ chiarezza</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  Flussi più comprensibili tra proprietari, veterinari e servizi.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/85 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-semibold tracking-tight text-zinc-900">+ rapidità</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  Azioni principali subito visibili e pronte quando servono.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-[#f7f2e9] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Ecosistema UNIMALIA
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
                    Tutto più coerente, meno disperso.
                  </h2>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  <Image
                    src="/logo-main.png"
                    alt="Logo UNIMALIA"
                    width={92}
                    height={84}
                    className="h-11 w-auto"
                    priority
                  />
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                  <p className="text-sm font-semibold text-zinc-900">Identità digitale</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    Scheda animale, QR code e dati essenziali in una base unica.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                  <p className="text-sm font-semibold text-zinc-900">Territorio ed emergenza</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    Smarrimenti, trovati, avvistamenti e lieti fine più leggibili e ordinati.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                  <p className="text-sm font-semibold text-zinc-900">Continuità clinica</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    Accessi controllati e collaborazione più chiara con i professionisti.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm">
                <Link
                  href="/professionisti/dashboard"
                  className="font-semibold text-zinc-900 transition hover:text-teal-700"
                >
                  Area professionisti →
                </Link>
                <Link href="/prezzi" className="text-zinc-600 transition hover:text-zinc-900">
                  Prezzi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-18">
        <div className="grid gap-5 xl:grid-cols-3">
          <QuickActionCard
            number="1"
            title="Crea l’identità animale"
            text="Parti da una base chiara: dati essenziali, QR code e strumenti pronti all’uso."
            href="/identita/nuovo"
            cta="Inizia ora"
          />
          <QuickActionCard
            number="2"
            title="Hai perso un animale?"
            text="Pubblica subito una segnalazione ordinata per muoverti in modo più rapido e concreto."
            href="/smarrimenti/nuovo"
            cta="Segnala smarrimento"
          />
          <QuickActionCard
            number="3"
            title="Hai trovato o avvistato un animale?"
            text="Invia una segnalazione utile per facilitare il ricongiungimento e raccogliere informazioni."
            href="/trovati/nuovo"
            cta="Segnala ora"
          />
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <SectionIntro
              eyebrow="Perché nasce"
              title="Quando le informazioni sono sparse, anche le cose semplici diventano più difficili."
              description="Email, carta, messaggi, referti e dettagli salvati in posti diversi rallentano tutto. UNIMALIA nasce per creare una base unica più chiara, prima dell’emergenza, durante l’emergenza e anche dopo."
            />
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-semibold text-zinc-900">✔ Dati essenziali più ordinati</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-semibold text-zinc-900">
                ✔ Strumenti rapidi quando serve agire
              </p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-semibold text-zinc-900">
                ✔ Più chiarezza tra proprietari e professionisti
              </p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-semibold text-zinc-900">
                ✔ Meno dispersione, più continuità
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <SectionIntro
          eyebrow="Cosa puoi fare"
          title="Le azioni principali sono subito chiare"
          description="La home deve orientare in pochi secondi: cosa puoi fare, dove devi andare e perché ti conviene farlo da qui."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            title="Crea l’identità dell’animale"
            text="Raccogli i dati essenziali in una scheda digitale chiara, più semplice da consultare e riutilizzare."
          />
          <FeatureCard
            title="Pubblica uno smarrimento"
            text="Centralizza subito le informazioni importanti e rendi la ricerca più ordinata."
          />
          <FeatureCard
            title="Segnala trovato o avvistato"
            text="Aiuta a raccogliere segnalazioni utili sul territorio in modo più verificabile e leggibile."
          />
          <FeatureCard
            title="Collabora con professionisti"
            text="Concedi accessi controllati e prepara una continuità migliore con veterinari e operatori del settore."
          />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <SectionIntro
          eyebrow="Per chi è"
          title="Percorsi distinti, ruoli più chiari"
          description="UNIMALIA funziona meglio quando ogni utente capisce subito il proprio spazio, il proprio ruolo e l’azione giusta da fare."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <AudienceCard
            title="Per i proprietari"
            text="Uno spazio più ordinato per gestire identità, accessi e momenti delicati senza perdere tempo."
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
            text="Un flusso più pulito per accedere ai dati autorizzati, lavorare sulla cartella clinica e gestire consulti."
            bullets={[
              "Richiedi accesso agli animali solo quando autorizzato dal proprietario.",
              "Operi sulla cartella clinica con tracciabilità e ruoli più chiari.",
              "Invii consulti e condividi eventi clinici in modo controllato.",
            ]}
            href="/professionisti/dashboard"
            cta="Apri area veterinari"
          />

          <AudienceCard
            title="Per altri professionisti"
            text="Uno spazio pensato per crescere oltre l’area clinica, mantenendo funzioni e responsabilità ben distinte."
            bullets={[
              "Toelettatori, pet sitter, pensioni e addestratori avranno strumenti dedicati al proprio lavoro.",
              "Le attività non cliniche resteranno separate dalla cartella veterinaria.",
              "L’obiettivo è favorire collaborazione, ordine e continuità tra servizi diversi.",
            ]}
            href="/servizi"
            cta="Scopri i servizi"
          />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <SectionIntro
          eyebrow="Come funziona"
          title="Prima prepari una base chiara, poi reagisci meglio"
          description="UNIMALIA deve essere utile prima dell’emergenza, durante l’emergenza e anche dopo."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          <TimelineStep
            number="1"
            title="Crea la scheda"
            text="Inserisci i dati principali dell’animale e genera la sua identità digitale."
          />
          <TimelineStep
            number="2"
            title="Attiva strumenti e accessi"
            text="Usa QR e codici, poi concedi ai professionisti solo gli accessi necessari."
          />
          <TimelineStep
            number="3"
            title="Gestisci segnalazioni"
            text="In caso di smarrimento, ritrovamento o avvistamento hai già una base più pronta e ordinata."
          />
          <TimelineStep
            number="4"
            title="Chiudi con lieto fine"
            text="Quando il caso si risolve, le informazioni restano più chiare e utili anche dopo."
          />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="rounded-[2.5rem] border border-black/5 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.05)] sm:px-8 sm:py-10 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Chiusura
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-4xl lg:text-5xl">
                UNIMALIA rende più semplice proteggere l’animale nel momento in cui conta davvero.
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
              <Link href="/prezzi" className="pt-2 text-sm text-zinc-600 transition hover:text-zinc-900">
                Prezzi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}