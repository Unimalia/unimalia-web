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
    images: ["/logo-512.png"],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA | Infrastruttura digitale per il mondo animale",
    description:
      "Identità animale, cartella clinica condivisa, smarrimenti, ritrovamenti e continuità tra professionisti in un unico ecosistema digitale.",
    images: ["/logo-512.png"],
  },
};

function HeaderButton({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition",
        primary
          ? "bg-[#2f69c7] text-white shadow-[0_10px_22px_rgba(47,105,199,0.22)] hover:bg-[#2558ab]"
          : "border border-[#d4dce7] bg-white text-[#31486f] hover:bg-[#f8fbff]",
      ].join(" ")}
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
      className="inline-flex items-center justify-center rounded-full bg-[#2f69c7] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,105,199,0.24)] transition hover:bg-[#2558ab]"
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
      className="inline-flex items-center justify-center rounded-full border border-[#d5dde8] bg-white px-7 py-3.5 text-sm font-semibold text-[#2b456f] transition hover:bg-[#f8fbff]"
    >
      {children}
    </Link>
  );
}

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`mx-auto w-full max-w-[1180px] px-4 ${className}`}>{children}</section>;
}

function SectionTitle({
  title,
  text,
}: {
  title: string;
  text?: string;
}) {
  return (
    <div className="text-center">
      <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-[#30486f] md:text-[38px]">
        {title}
      </h2>
      {text ? (
        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[#64748e] md:text-lg">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[28px] border border-[#dce3ec] bg-white shadow-[0_18px_40px_rgba(37,54,88,0.08)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function TopCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <CardShell className="h-full p-7">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#eef4fb]">
          {icon}
        </div>
        <h3 className="mt-6 text-[28px] font-semibold tracking-[-0.03em] text-[#30486f]">
          {title}
        </h3>
        <p className="mt-4 text-[15px] leading-relaxed text-[#667691]">{text}</p>
      </div>
    </CardShell>
  );
}

function SplitFeature({
  title,
  text,
  bullets,
  visual,
  reverse = false,
}: {
  title: string;
  text: string;
  bullets: string[];
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <CardShell className="overflow-hidden">
      <div
        className={[
          "grid min-h-[320px] grid-cols-1 md:grid-cols-2",
          reverse ? "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1" : "",
        ].join(" ")}
      >
        <div className="flex flex-col justify-center px-8 py-8 md:px-10">
          <h3 className="text-[30px] font-semibold tracking-[-0.03em] text-[#30486f]">{title}</h3>
          <p className="mt-4 text-[16px] leading-relaxed text-[#667691]">{text}</p>

          <div className="mt-6 space-y-3">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#2f69c7]" />
                <p className="text-[15px] font-medium text-[#395277]">{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#edf3fa_100%)]">
          {visual}
        </div>
      </div>
    </CardShell>
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
    <CardShell className="h-full p-7">
      <h3 className="text-[28px] font-semibold tracking-[-0.03em] text-[#30486f]">{title}</h3>
      <p className="mt-4 text-[15px] leading-relaxed text-[#667691]">{text}</p>

      <div className="mt-6 space-y-3">
        {bullets.map((bullet) => (
          <div key={bullet} className="flex items-start gap-3">
            <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#2f69c7]" />
            <p className="text-[15px] font-medium text-[#395277]">{bullet}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-[#2f69c7] transition hover:text-[#2558ab]"
        >
          {cta} →
        </Link>
      </div>
    </CardShell>
  );
}

function ActionCard({
  title,
  text,
  href,
  cta,
  accent,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  accent: "blue" | "orange" | "green";
}) {
  const accentClass =
    accent === "orange"
      ? "bg-[#fff5ec]"
      : accent === "green"
        ? "bg-[#f2fbf4]"
        : "bg-[#f5f9ff]";

  return (
    <CardShell className={`h-full p-7 ${accentClass}`}>
      <h3 className="text-[26px] font-semibold tracking-[-0.03em] text-[#30486f]">{title}</h3>
      <p className="mt-4 text-[15px] leading-relaxed text-[#667691]">{text}</p>

      <div className="mt-8">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-[#2f69c7] transition hover:text-[#2558ab]"
        >
          {cta} →
        </Link>
      </div>
    </CardShell>
  );
}

function HeroAnimalOutline() {
  return (
    <svg
      viewBox="0 0 520 300"
      className="absolute inset-0 h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M323 37c35 8 64 30 83 59 12 18 18 37 19 57l21 13c11 6 21 15 29 27 6 9 11 21 13 36l-16-4c-6-11-13-20-23-26l-24-14c-9 24-30 44-57 53-28 9-60 7-90-6l-52-22c-26-11-52-17-81-17h-56l2-16h54c33 0 63 7 92 19l52 22c26 11 53 13 76 6 34-11 55-40 51-74-3-25-17-49-38-66-19-16-44-27-71-31l-14-2 0-17z"
        stroke="#8ea4be"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M302 45l-34-25 8 43"
        stroke="#b6c4d4"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M418 116l-19-23-8 35"
        stroke="#b6c4d4"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="355" cy="117" r="4" fill="#7f95af" />
      <circle cx="405" cy="153" r="4" fill="#7f95af" />
      <path
        d="M357 131c11 7 23 8 37 3"
        stroke="#7f95af"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M224 202l30-24m29 42l20-28m48 38l10-31m62 19l-7-39"
        stroke="#d1dae6"
        strokeWidth="2"
      />
      <path
        d="M260 165l47 26 45-13 50 20 53-4"
        stroke="#c5d1df"
        strokeWidth="2"
      />
      <path
        d="M289 144l35 46m39-37l-11 38m53-33l-4 40"
        stroke="#c5d1df"
        strokeWidth="2"
      />
      <circle cx="289" cy="144" r="3" fill="#a5b6c8" />
      <circle cx="307" cy="190" r="3" fill="#a5b6c8" />
      <circle cx="352" cy="178" r="3" fill="#a5b6c8" />
      <circle cx="402" cy="198" r="3" fill="#a5b6c8" />
      <circle cx="455" cy="194" r="3" fill="#a5b6c8" />
      <circle cx="363" cy="153" r="3" fill="#a5b6c8" />
      <circle cx="416" cy="159" r="3" fill="#a5b6c8" />
    </svg>
  );
}

function IdentityIcon() {
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" fill="none" aria-hidden="true">
      <rect x="14" y="20" width="46" height="30" rx="6" fill="white" stroke="#d5e0ee" strokeWidth="2" />
      <rect x="21" y="27" width="22" height="4" rx="2" fill="#bfd0e8" />
      <rect x="21" y="35" width="15" height="4" rx="2" fill="#d4dfec" />
      <rect x="21" y="43" width="22" height="4" rx="2" fill="#d4dfec" />
      <path d="M27 58h40" stroke="#b5c4d8" strokeWidth="3" strokeLinecap="round" />
      <rect x="50" y="24" width="22" height="22" rx="4" fill="white" stroke="#d5e0ee" strokeWidth="2" />
      <rect x="54" y="28" width="6" height="6" fill="#2f69c7" />
      <rect x="62" y="28" width="6" height="6" fill="#2f69c7" />
      <rect x="54" y="36" width="6" height="6" fill="#2f69c7" />
      <rect x="62" y="36" width="3" height="3" fill="#2f69c7" />
      <circle cx="59" cy="50" r="11" fill="#2f69c7" />
      <path d="M54 50l4 4 7-8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClinicIcon() {
  return (
    <svg width="104" height="92" viewBox="0 0 104 92" fill="none" aria-hidden="true">
      <rect x="14" y="18" width="64" height="40" rx="6" fill="#334155" />
      <rect x="20" y="24" width="52" height="28" rx="4" fill="#f8fbff" />
      <rect x="24" y="28" width="20" height="4" rx="2" fill="#bfd0e8" />
      <rect x="24" y="36" width="28" height="4" rx="2" fill="#d6e0ec" />
      <rect x="24" y="44" width="18" height="4" rx="2" fill="#d6e0ec" />
      <path d="M8 64h76" stroke="#9fb2c8" strokeWidth="3" strokeLinecap="round" />
      <rect x="62" y="33" width="22" height="26" rx="5" fill="white" stroke="#d5e0ee" strokeWidth="2" />
      <path d="M73 40l2.5 5h5l-4 3.5 1.2 5-4.7-2.5-4.7 2.5 1.2-5-4-3.5h5L73 40z" fill="#7ea6dd" />
    </svg>
  );
}

function ImagingIcon() {
  return (
    <svg width="104" height="92" viewBox="0 0 104 92" fill="none" aria-hidden="true">
      <rect x="14" y="18" width="60" height="40" rx="6" fill="#2d3748" />
      <rect x="19" y="23" width="50" height="30" rx="4" fill="#111827" />
      <path
        d="M28 42c7-10 15-13 23-12 7 1 13 5 18 10-7 5-14 8-22 8-8 0-14-2-19-6z"
        fill="#c8d4e3"
      />
      <rect x="77" y="30" width="14" height="22" rx="4" fill="#dbe7f4" />
      <rect x="90" y="26" width="10" height="26" rx="4" fill="#e8eff8" />
      <rect x="79" y="36" width="8" height="3" rx="1.5" fill="#aac0d9" />
    </svg>
  );
}

function NetworkVisual() {
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 600 320" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
        <path d="M0 250c60-20 120-18 180 0s120 26 180 8 120-22 240 2" stroke="#d9e3ef" strokeWidth="2" />
        <path d="M30 220l80-30 70 24 90-46 95 20 90-38 65 28" stroke="#bdd0e4" strokeWidth="2" />
        <path d="M110 190l72 24 88-46 95 20 90-38" stroke="#aec4dc" strokeWidth="2" />
        <circle cx="110" cy="190" r="4" fill="#9db4ce" />
        <circle cx="182" cy="214" r="4" fill="#9db4ce" />
        <circle cx="270" cy="168" r="4" fill="#9db4ce" />
        <circle cx="365" cy="188" r="4" fill="#9db4ce" />
        <circle cx="455" cy="150" r="4" fill="#9db4ce" />
      </svg>

      <div className="absolute left-[16%] top-[18%] h-[170px] w-[220px] rounded-[18px] bg-white shadow-[0_14px_28px_rgba(44,72,111,0.12)] ring-1 ring-[#d8e1eb]">
        <div className="h-8 rounded-t-[18px] bg-[#eff5fb]" />
        <div className="flex h-[calc(100%-32px)] items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-[#dbe7f4]" />
          <div className="absolute left-[46px] top-[66px] h-12 w-12 rounded-full bg-[#c4d6ea]" />
          <div className="absolute right-[46px] top-[74px] h-10 w-10 rounded-full bg-[#c4d6ea]" />
        </div>
      </div>

      <div className="absolute right-[12%] top-[22%] flex h-[76px] w-[76px] items-center justify-center rounded-[18px] bg-white shadow-[0_12px_24px_rgba(44,72,111,0.12)] ring-1 ring-[#d8e1eb]">
        <div className="h-10 w-10 rounded-full bg-[#d6e3f1]" />
      </div>
    </div>
  );
}

function PetWorldVisual() {
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 600 320" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
        <path d="M0 260c80-18 150-24 230-4s150 26 230 4 100-22 140-14" stroke="#dde7f1" strokeWidth="2" />
      </svg>

      <div className="absolute left-[14%] bottom-[18%] h-[42px] w-[92px] rounded-[10px] bg-[#d9e4f0]" />
      <div className="absolute left-[29%] bottom-[16%] h-[64px] w-[72px] rounded-t-[28px] rounded-b-[10px] bg-[#7589a2]" />
      <div className="absolute left-[26%] bottom-[35%] h-[14px] w-[46px] rounded-full bg-[#879ab1]" />

      <svg viewBox="0 0 220 220" className="absolute right-[12%] bottom-[4%] h-[210px] w-[210px]" fill="none" aria-hidden="true">
        <path
          d="M86 26l22 18 22-16c18 6 32 21 40 40 10 24 10 50 6 75-4 25-14 46-28 61H55c-8-12-11-24-11-39 0-23 8-45 20-61 7-9 15-16 22-21z"
          stroke="#8aa1bb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M74 70l34 19 34-19m-62 48l28-29 30 30m-74 34l46-34 58 36" stroke="#c3d0df" strokeWidth="2" />
        <circle cx="80" cy="70" r="3" fill="#9fb2c8" />
        <circle cx="108" cy="89" r="3" fill="#9fb2c8" />
        <circle cx="142" cy="70" r="3" fill="#9fb2c8" />
        <circle cx="108" cy="119" r="3" fill="#9fb2c8" />
        <circle cx="138" cy="120" r="3" fill="#9fb2c8" />
        <circle cx="82" cy="153" r="3" fill="#9fb2c8" />
        <circle cx="128" cy="119" r="3" fill="#9fb2c8" />
      </svg>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f4] text-zinc-900">
      <div className="mx-auto max-w-[1220px] px-4 py-7 md:py-10">
        <CardShell className="overflow-hidden">
          <header className="border-b border-[#e1e7ee] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-6 px-7 py-5 md:px-9">
              <Link href="/" className="flex items-center gap-4">
                <Image
                  src="/logo-main.png"
                  alt="UNIMALIA"
                  width={170}
                  height={48}
                  className="h-10 w-auto"
                  priority
                />
              </Link>

              <nav className="hidden items-center gap-8 lg:flex">
                <Link href="/identita" className="text-[15px] font-medium text-[#4a5f82] hover:text-[#30486f]">
                  Identità
                </Link>
                <Link href="/professionisti/dashboard" className="text-[15px] font-medium text-[#4a5f82] hover:text-[#30486f]">
                  Area clinica
                </Link>
                <Link href="/servizi" className="text-[15px] font-medium text-[#4a5f82] hover:text-[#30486f]">
                  Professionisti
                </Link>
                <Link href="/smarrimenti" className="text-[15px] font-medium text-[#4a5f82] hover:text-[#30486f]">
                  Smarrimenti
                </Link>
                <Link href="/prezzi" className="text-[15px] font-medium text-[#4a5f82] hover:text-[#30486f]">
                  Prezzi
                </Link>
              </nav>

              <div className="flex items-center gap-3">
                <HeaderButton href="/professionisti/login">Contattaci</HeaderButton>
              </div>
            </div>
          </header>

          <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
            <div className="grid min-h-[360px] grid-cols-1 md:grid-cols-[1.08fr_0.92fr]">
              <div className="flex flex-col justify-center px-8 py-10 md:px-10 lg:px-14">
                <h1 className="max-w-[620px] text-[38px] font-semibold tracking-[-0.04em] text-[#30486f] md:text-[54px]">
                  L’infrastruttura digitale per il mondo animale.
                </h1>

                <p className="mt-5 max-w-[560px] text-[18px] leading-relaxed text-[#667691] md:text-[22px]">
                  Identità animale, Dati clinici, Continuità assistenziale, Smarrimenti e
                  Connessione tra professionisti.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton href="/identita">Scopri la piattaforma</PrimaryButton>
                  <SecondaryButton href="/smarrimenti/nuovo">Segnala smarrimento</SecondaryButton>
                </div>
              </div>

              <div className="relative min-h-[280px] overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)]">
                <HeroAnimalOutline />
              </div>
            </div>
          </section>

          <section className="border-t border-[#e1e7ee] bg-white px-7 py-10 md:px-9 md:py-12">
            <div className="grid gap-8 md:grid-cols-3">
              <TopCard
                title="Identità Digitale"
                text="Componenti integrati e generabili per dare all’animale una base digitale chiara, riutilizzabile e controllabile."
                icon={<IdentityIcon />}
              />
              <TopCard
                title="Cartella Clinica Condivisa"
                text="Processi chiari, accessi controllati e continuità informativa tra proprietario, clinica e professionisti autorizzati."
                icon={<ClinicIcon />}
              />
              <TopCard
                title="Imaging Diagnostico"
                text="Dai dati alle decisioni concrete, con una struttura predisposta per referti, imaging e collaborazione clinica."
                icon={<ImagingIcon />}
              />
            </div>
          </section>

          <section className="border-t border-[#e1e7ee] bg-white px-7 py-10 md:px-9 md:py-12">
            <div className="grid gap-8 md:grid-cols-2">
              <SplitFeature
                title="Connetti Veterinari e Cliniche"
                text="Un ecosistema progettato per unire dati, accessi e continuità operativa tra professionisti, strutture e consulti."
                bullets={[
                  "Accessi clinici controllati",
                  "Consulti tra cliniche e veterinari",
                  "Condivisione referti ed eventi",
                ]}
                visual={<NetworkVisual />}
              />

              <SplitFeature
                title="Gestisci tutto il tuo mondo Pet"
                text="UNIMALIA non è solo area clinica: è anche identità animale, servizi, storico e strumenti utili per il proprietario."
                bullets={[
                  "Tutti i dati in un’unica piattaforma",
                  "Connessione con servizi e professionisti",
                  "Base ordinata prima, durante e dopo l’emergenza",
                ]}
                visual={<PetWorldVisual />}
              />
            </div>
          </section>

          <section className="border-t border-[#e1e7ee] bg-[#fbfcfe] px-7 py-10 md:px-9 md:py-12">
            <div className="grid gap-6 md:grid-cols-4">
              <div className="flex items-center justify-center gap-3 text-center md:text-left">
                <ShieldIcon />
                <div>
                  <p className="text-[16px] font-semibold text-[#35527f]">Accesso Sicuro</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 text-center md:text-left">
                <ClinicIcon />
                <div>
                  <p className="text-[16px] font-semibold text-[#35527f]">Referti Condivisi</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 text-center md:text-left">
                <PawSmall />
                <div>
                  <p className="text-[16px] font-semibold text-[#35527f]">Interoperabilità</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 text-center md:text-left">
                <HeartPin />
                <div>
                  <p className="text-[16px] font-semibold text-[#35527f]">Trova il tuo Pet</p>
                </div>
              </div>
            </div>
          </section>
        </CardShell>

        <Section className="pt-14 md:pt-18">
          <SectionTitle
            title="Una piattaforma completa, non solo clinica"
            text="Questa versione mantiene la solidità del mockup ma si allarga al resto dell’ecosistema UNIMALIA: proprietari, smarrimenti, professionisti e continuità tra mondi diversi."
          />
        </Section>

        <Section className="pt-10">
          <div className="grid gap-6 lg:grid-cols-3">
            <AudienceCard
              title="Per i proprietari"
              text="Una base chiara per identità animale, accessi, storico e strumenti utili nei momenti più delicati."
              bullets={[
                "Identità digitale dell’animale",
                "Controllo accessi ai dati clinici",
                "Storico più ordinato nel tempo",
              ]}
              href="/identita"
              cta="Apri area identità"
            />

            <AudienceCard
              title="Per i veterinari"
              text="Un ambiente più strutturato per cartella clinica, consulti, referti, imaging e continuità assistenziale."
              bullets={[
                "Grant e accessi autorizzati",
                "Cartella clinica condivisa",
                "Consulti e interoperabilità",
              ]}
              href="/professionisti/dashboard"
              cta="Apri area clinica"
            />

            <AudienceCard
              title="Per i professionisti pet"
              text="Uno spazio coerente per toelettatori, pensioni, pet sitter, educatori e servizi non clinici."
              bullets={[
                "Storico servizi",
                "Connessione col profilo animale",
                "Collaborazione più ordinata con il resto dell’ecosistema",
              ]}
              href="/servizi"
              cta="Scopri i servizi"
            />
          </div>
        </Section>

        <Section className="pt-14 md:pt-18">
          <SectionTitle
            title="Momenti concreti, azioni immediate"
            text="UNIMALIA deve funzionare non solo come infrastruttura, ma anche come strumento pratico quando serve agire subito."
          />
        </Section>

        <Section className="pt-10">
          <div className="grid gap-6 md:grid-cols-3">
            <ActionCard
              title="Smarrimenti"
              text="Pubblica rapidamente una segnalazione chiara, centralizzata e predisposta per favorire visibilità e rapidità."
              href="/smarrimenti/nuovo"
              cta="Segnala smarrimento"
              accent="orange"
            />

            <ActionCard
              title="Trovati / Avvistati"
              text="Raccogli segnalazioni utili sul territorio per migliorare il ricongiungimento tra animale e proprietario."
              href="/trovati/nuovo"
              cta="Segnala trovato o avvistato"
              accent="blue"
            />

            <ActionCard
              title="Lieti Fine"
              text="Chiudi correttamente il caso e mantieni uno storico più ordinato dei momenti importanti vissuti dall’animale."
              href="/lieti-fine"
              cta="Vai ai lieti fine"
              accent="green"
            />
          </div>
        </Section>

        <Section className="pt-14 md:pt-18">
          <CardShell className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-8 py-10 md:px-12 md:py-14">
            <div className="grid gap-8 md:grid-cols-[1.08fr_0.92fr] md:items-center">
              <div>
                <h2 className="text-[34px] font-semibold tracking-[-0.04em] text-[#30486f] md:text-[46px]">
                  Un’unica infrastruttura per il mondo animale.
                </h2>
                <p className="mt-5 max-w-[620px] text-[17px] leading-relaxed text-[#667691] md:text-[20px]">
                  Identità digitale, dati clinici, smarrimenti, connessione tra professionisti,
                  servizi e continuità nel tempo: meno dispersione, più chiarezza, più utilità.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton href="/identita/nuovo">Inizia ora</PrimaryButton>
                  <SecondaryButton href="/prezzi">Vedi prezzi</SecondaryButton>
                </div>
              </div>

              <div className="relative min-h-[220px] overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#f8fbff_0%,#edf3fa_100%)]">
                <HeroAnimalOutline />
              </div>
            </div>
          </CardShell>
        </Section>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 54 54" fill="none" aria-hidden="true">
      <circle cx="27" cy="27" r="27" fill="#EEF4FD" />
      <path
        d="M27 12l12 5v8c0 8.5-5.5 14.5-12 17-6.5-2.5-12-8.5-12-17v-8l12-5z"
        fill="#6396DB"
      />
      <path
        d="M27 21l2.5 5.3 5.8.8-4.2 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.2-4 5.8-.8L27 21z"
        fill="white"
      />
    </svg>
  );
}

function PawSmall() {
  return (
    <svg width="36" height="36" viewBox="0 0 54 54" fill="none" aria-hidden="true">
      <circle cx="27" cy="27" r="27" fill="#EEF4FD" />
      <circle cx="19" cy="18" r="5" fill="#6C9FE1" />
      <circle cx="35" cy="18" r="5" fill="#6C9FE1" />
      <circle cx="15" cy="28" r="4.5" fill="#F2B24C" />
      <circle cx="39" cy="28" r="4.5" fill="#F2B24C" />
      <path d="M27 23c-5.8 0-10 5.1-10 9.2 0 4.2 3.5 6.8 10 6.8s10-2.6 10-6.8c0-4.1-4.2-9.2-10-9.2z" fill="#6C9FE1" />
    </svg>
  );
}

function HeartPin() {
  return (
    <svg width="36" height="36" viewBox="0 0 54 54" fill="none" aria-hidden="true">
      <circle cx="27" cy="27" r="27" fill="#EEF4FD" />
      <path
        d="M27 41c7-8 12-13 12-19a7 7 0 0 0-12-4 7 7 0 0 0-12 4c0 6 5 11 12 19z"
        fill="#7ea6dd"
      />
      <circle cx="37.5" cy="37.5" r="6" fill="#2f69c7" />
    </svg>
  );
}