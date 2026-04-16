import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UNIMALIA | Infrastruttura digitale per il mondo animale",
  description:
    "UNIMALIA unisce identità animale, dati clinici, smarrimenti, ritrovamenti e connessione tra proprietari, veterinari e professionisti del mondo pet.",
  alternates: {
    canonical: "https://unimalia.it/",
  },
  openGraph: {
    title: "UNIMALIA | Infrastruttura digitale per il mondo animale",
    description:
      "Identità animale, cartella clinica condivisa, smarrimenti, ritrovamenti e continuità tra professionisti in un unico ecosistema digitale.",
    url: "https://unimalia.it/",
    siteName: "UNIMALIA",
    images: ["/home/logo-app.png"],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA | Infrastruttura digitale per il mondo animale",
    description:
      "Identità animale, cartella clinica condivisa, smarrimenti, ritrovamenti e continuità tra professionisti in un unico ecosistema digitale.",
    images: ["/home/logo-app.png"],
  },
};

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-[14px] font-medium tracking-[-0.01em] text-[#44597c] transition hover:text-[#274d84]"
    >
      {children}
    </Link>
  );
}

function HeaderButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-[#d5dde8] bg-white px-6 py-2.5 text-sm font-medium text-[#31486f] transition hover:bg-[#f8fbff]"
    >
      {children}
    </Link>
  );
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,#2f69c7_0%,#2558ab_100%)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(47,105,199,0.24)] transition hover:scale-[1.01]"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-[#d7dfe9] bg-white px-7 py-3.5 text-sm font-semibold text-[#31486f] transition hover:bg-[#f8fbff]"
    >
      {children}
    </Link>
  );
}

function MainShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-[#dde4ec] bg-white shadow-[0_24px_60px_rgba(42,56,86,0.10)]">
      {children}
    </div>
  );
}

function SectionDivider() {
  return <div className="h-px w-full bg-[#e5ebf1]" />;
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-[#5f708a] sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function HeroStat({
  value,
  text,
}: {
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#e3e9f0] bg-white/85 p-4 shadow-[0_10px_24px_rgba(42,56,86,0.06)] backdrop-blur">
      <p className="text-[22px] font-semibold tracking-[-0.03em] text-[#30486f]">{value}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#5f708a]">{text}</p>
    </div>
  );
}

function FeatureImageCard({
  title,
  text,
  imageSrc,
  imageAlt,
  bordered = false,
}: {
  title: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={[
        "flex h-full flex-col items-center px-5 py-6 text-center",
        bordered ? "md:border-r md:border-[#e5ebf1]" : "",
      ].join(" ")}
    >
      <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#30486f]">
        {title}
      </h2>

      <div className="relative mt-6 flex h-[180px] w-full items-center justify-center">
        <div className="relative h-full w-full max-w-[320px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 320px"
          />
        </div>
      </div>

      <p className="mt-4 max-w-[280px] text-[14px] leading-relaxed text-[#5f708a] md:text-[15px]">
        {text}
      </p>
    </div>
  );
}

function SplitImageFeature({
  title,
  text,
  imageSrc,
  imageAlt,
  reverse = false,
  bordered = false,
}: {
  title: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  bordered?: boolean;
}) {
  return (
    <div
      className={[
        "grid min-h-[300px] grid-cols-1 md:grid-cols-2",
        bordered ? "md:border-r md:border-[#e5ebf1]" : "",
        reverse ? "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1" : "",
      ].join(" ")}
    >
      <div className="flex items-center px-8 py-8 md:px-10 md:py-10">
        <div className="max-w-[420px]">
          <h2 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#30486f] md:text-[38px]">
            {title}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#5f708a] md:text-[18px]">
            {text}
          </p>
        </div>
      </div>

      <div className="relative min-h-[250px] overflow-hidden">
        <div className="relative h-full min-h-[250px] w-full">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-contain object-center"
            sizes="(max-width: 768px) 100vw, 620px"
          />
        </div>
      </div>
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
      className="group block rounded-[2rem] border border-[#e3e9f0] bg-white p-7 shadow-[0_14px_40px_rgba(42,56,86,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(42,56,86,0.08)]"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
          Azione {number}
        </p>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#30486f] text-sm font-semibold text-white">
          {number}
        </div>
      </div>

      <h2 className="mt-8 text-2xl font-semibold tracking-tight text-[#30486f]">{title}</h2>
      <p className="mt-4 text-sm leading-relaxed text-[#5f708a] sm:text-base">{text}</p>
      <div className="mt-8 text-sm font-semibold text-[#30486f] transition group-hover:text-[#2f69c7]">
        {cta} →
      </div>
    </Link>
  );
}

function HighlightBox({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e3e9f0] bg-white p-5 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
      <p className="text-sm font-semibold text-[#30486f]">{text}</p>
    </div>
  );
}

function UseCaseCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[#e3e9f0] bg-white p-6 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
      <h2 className="text-lg font-semibold tracking-tight text-[#30486f] sm:text-xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[#5f708a] sm:text-base">{text}</p>
    </div>
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
    <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-7 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
      <h2 className="text-2xl font-semibold tracking-tight text-[#30486f]">{title}</h2>
      <p className="mt-4 text-sm leading-relaxed text-[#5f708a] sm:text-base">{text}</p>

      <ul className="mt-6 space-y-3 text-sm leading-relaxed text-[#4f6078]">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2f69c7]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-[#30486f] transition hover:text-[#2f69c7]"
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
    <div className="rounded-[2rem] border border-[#e3e9f0] bg-white p-7 shadow-[0_14px_40px_rgba(42,56,86,0.06)]">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#30486f] text-sm font-semibold text-white">
        {number}
      </div>
      <h2 className="mt-6 text-xl font-semibold text-[#30486f]">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-[#5f708a]">{text}</p>
    </div>
  );
}

function BottomItem({
  title,
}: {
  title: string;
}) {
  return (
    <div className="flex items-center justify-center px-3 text-center md:text-left">
      <span className="text-[15px] font-medium text-[#4a6182]">{title}</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f3f4f6] text-zinc-900">
      <div className="mx-auto max-w-[1260px] px-4 py-7 md:py-10">
        <MainShell>
          <header className="border-b border-[#e3e9f0] bg-white">
            <div className="flex flex-col gap-5 px-7 py-5 md:px-10">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/home/logo-header.png"
                    alt="UNIMALIA"
                    width={240}
                    height={64}
                    className="h-11 w-auto"
                    priority
                  />
                </Link>

                <div className="flex items-center gap-3">
                  <HeaderButton href="mailto:info@unimalia.it">Contattaci</HeaderButton>
                </div>
              </div>

              <nav
                className="flex flex-wrap items-center gap-x-6 gap-y-3"
                aria-label="Navigazione principale"
              >
                <NavLink href="/smarrimenti">Smarrimenti</NavLink>
                <NavLink href="/trovati">Trovati / Avvistati</NavLink>
                <NavLink href="/lieti-fine">Lieti Fine</NavLink>
                <NavLink href="/adotta">Adozioni</NavLink>
                <NavLink href="/servizi">Servizi</NavLink>
                <NavLink href="/identita">Identità animale</NavLink>
                <NavLink href="/professionisti">Area professionisti</NavLink>
                <NavLink href="/profilo">Profilo</NavLink>
              </nav>
            </div>
          </header>

          <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
            <div className="grid min-h-[560px] grid-cols-1 md:grid-cols-[0.96fr_1.04fr]">
              <div className="flex flex-col justify-center px-8 py-12 md:px-10 lg:px-14">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
                  Building the Digital Infrastructure of Veterinary Care
                </p>

                <h1 className="mt-6 max-w-[660px] text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#30486f] md:text-[62px]">
                  L’infrastruttura digitale che mancava al mondo veterinario
                </h1>

                <p className="mt-6 max-w-[580px] text-[18px] leading-relaxed text-[#5f708a] md:text-[22px]">
                  Identità animale, dati clinici, smarrimenti, consulti e continuità tra
                  professionisti in un’unica piattaforma più chiara, più forte, più utile.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <PrimaryButton href="/identita">Scopri la piattaforma</PrimaryButton>
                  <SecondaryButton href="/smarrimenti/nuovo">Segnala smarrimento</SecondaryButton>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  <HeroStat
                    value="1 base unica"
                    text="Per identità animale, storico, accessi e strumenti chiave."
                  />
                  <HeroStat
                    value="+ continuità"
                    text="Tra proprietario, clinica, veterinari e rete professionale."
                  />
                  <HeroStat
                    value="+ rapidità"
                    text="Nei momenti in cui serve agire subito e con ordine."
                  />
                </div>
              </div>

              <div className="relative min-h-[380px] overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)]">
                <div className="relative h-full min-h-[380px] w-full">
                  <Image
                    src="/home/hero-animals.png"
                    alt="Hero UNIMALIA con cane, gatto e identità digitale"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 900px"
                  />
                </div>
              </div>
            </div>
          </section>

          <SectionDivider />

          <section className="bg-white px-7 py-10 md:px-10 md:py-12">
            <div className="grid gap-10 md:grid-cols-3 md:gap-0">
              <FeatureImageCard
                title="Identità Digitale"
                text="Componenti integrali e generabili."
                imageSrc="/home/feature-identity.png"
                imageAlt="Visual identità digitale UNIMALIA"
                bordered
              />
              <FeatureImageCard
                title="Cartella Clinica Condivisa"
                text="Processi chiari e verificabili."
                imageSrc="/home/feature-clinic.png"
                imageAlt="Visual cartella clinica condivisa UNIMALIA"
                bordered
              />
              <FeatureImageCard
                title="Imaging Diagnostico"
                text="Dai dati alle decisioni concrete."
                imageSrc="/home/feature-imaging.png"
                imageAlt="Visual imaging diagnostico UNIMALIA"
              />
            </div>
          </section>

          <SectionDivider />

          <section className="bg-white px-7 md:px-10">
            <div className="grid gap-0 md:grid-cols-2">
              <SplitImageFeature
                title="Connetti Veterinari e Cliniche"
                text="Un ecosistema progettato per unire professionisti, strutture, accessi e continuità operativa."
                imageSrc="/home/network-vets.png"
                imageAlt="Visual rete di veterinari e cliniche"
                bordered
              />
              <SplitImageFeature
                title="Gestisci tutto il tuo mondo Pet"
                text="Tutti i dati del tuo animale in un’unica piattaforma, dal profilo all’emergenza fino alla continuità futura."
                imageSrc="/home/pet-world.png"
                imageAlt="Visual mondo pet UNIMALIA"
                reverse
              />
            </div>
          </section>

          <SectionDivider />

          <section className="bg-white px-7 py-6 md:px-10 md:py-7">
            <div className="grid gap-5 md:grid-cols-4">
              <BottomItem title="Accesso Sicuro" />
              <BottomItem title="Referti Condivisi" />
              <BottomItem title="Interoperabilità" />
              <BottomItem title="Trova il tuo Pet" />
            </div>
          </section>
        </MainShell>

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
              <HighlightBox text="✔ Dati essenziali più ordinati" />
              <HighlightBox text="✔ Strumenti rapidi quando serve agire" />
              <HighlightBox text="✔ Più chiarezza tra proprietari e professionisti" />
              <HighlightBox text="✔ Meno dispersione, più continuità" />
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <SectionIntro
            eyebrow="Cosa puoi fare"
            title="Le azioni principali sono subito chiare"
            description="La homepage deve orientare in pochi secondi: cosa puoi fare, dove devi andare e perché conviene farlo da qui."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <UseCaseCard
              title="Crea l’identità dell’animale"
              text="Raccogli i dati essenziali in una scheda digitale chiara, più semplice da consultare e riutilizzare."
            />
            <UseCaseCard
              title="Pubblica uno smarrimento"
              text="Centralizza subito le informazioni importanti e rendi la ricerca più ordinata."
            />
            <UseCaseCard
              title="Segnala trovato o avvistato"
              text="Aiuta a raccogliere segnalazioni utili sul territorio in modo più verificabile e leggibile."
            />
            <UseCaseCard
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
          <div className="overflow-hidden rounded-[2.5rem] border border-[#e3e9f0] bg-white shadow-[0_24px_80px_rgba(42,56,86,0.08)]">
            <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
              <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#55657d]">
                  Chiusura
                </p>
                <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#30486f] sm:text-4xl lg:text-5xl">
                  UNIMALIA rende più semplice proteggere l’animale nel momento in cui conta davvero.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#5f708a] sm:text-lg">
                  Identità digitale, accessi clinici controllati, consulti, smarrimenti, animali
                  trovati, avvistamenti e lieti fine: meno dispersione, più chiarezza, più fiducia.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <PrimaryButton href="/identita/nuovo">Crea identità animale</PrimaryButton>
                  <SecondaryButton href="/smarrimenti/nuovo">Segnala smarrimento</SecondaryButton>
                  <SecondaryButton href="/trovati/nuovo">Segnala trovato o avvistato</SecondaryButton>
                </div>

                <div className="mt-6">
                  <Link
                    href="/prezzi"
                    className="text-sm text-[#5f708a] transition hover:text-[#30486f]"
                  >
                    Prezzi
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[320px] bg-[linear-gradient(180deg,#f9fbff_0%,#eef4fb_100%)]">
                <div className="relative h-full min-h-[320px] w-full">
                  <Image
                    src="/home/hero-animals.png"
                    alt="Visual finale homepage UNIMALIA"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 700px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}