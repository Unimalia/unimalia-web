import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
  description:
    "UNIMALIA aiuta proprietari e professionisti a gestire identità animale, accessi clinici controllati, consulti, smarrimenti, segnalazioni di animali trovati e lieti fine in modo semplice e affidabile.",
  alternates: {
    canonical: "https://unimalia.it/",
  },
  openGraph: {
    title: "UNIMALIA | Identità animale digitale, dati clinici e smarrimenti",
    description:
      "Identità animale, accessi clinici controllati, consulti, smarrimenti, animali trovati e lieti fine: tutto in un unico ecosistema digitale.",
    url: "https://unimalia.it/",
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

function OrangeButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md bg-[#f07b2d] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(240,123,45,0.32)] transition hover:bg-[#df6d21]"
    >
      {children}
    </Link>
  );
}

function BlueButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md bg-[#2d67c8] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,103,200,0.28)] transition hover:bg-[#2458af]"
    >
      {children}
    </Link>
  );
}

function GreenButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md bg-[#4f9d51] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(79,157,81,0.28)] transition hover:bg-[#448946]"
    >
      {children}
    </Link>
  );
}

function WhiteButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md border border-[#d7dfea] bg-white px-6 text-sm font-semibold text-[#294a82] shadow-sm transition hover:bg-[#f8fbff]"
    >
      {children}
    </Link>
  );
}

function SectionShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`mx-auto w-full max-w-[1160px] px-4 ${className}`}>{children}</section>;
}

function MiniFeature({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4 px-3 py-5 text-center md:text-left">
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-[15px] font-semibold leading-tight text-[#24467e]">{title}</div>
        <div className="text-[15px] font-semibold leading-tight text-[#24467e]">{subtitle}</div>
      </div>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <div className="flex h-[78px] w-[92px] items-center justify-center">{icon}</div>
      <div className="mt-3 text-center text-[13px] font-semibold text-[#304c7b]">{title}</div>
    </div>
  );
}

function BulletPanel({
  title,
  bullets,
  button,
  buttonHref,
  tone,
  visual,
}: {
  title: string;
  bullets: string[];
  button: string;
  buttonHref: string;
  tone: "orange" | "blue";
  visual: React.ReactNode;
}) {
  const buttonNode =
    tone === "orange" ? (
      <OrangeButton href={buttonHref}>{button}</OrangeButton>
    ) : (
      <BlueButton href={buttonHref}>{button}</BlueButton>
    );

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#d9e2ec] bg-white shadow-sm">
      <div className="grid min-h-[248px] grid-cols-1 md:grid-cols-[1fr_0.92fr]">
        <div className="bg-[linear-gradient(180deg,#eef5fd_0%,#f7fbff_100%)] px-7 py-7">
          <h3 className="text-[28px] font-bold tracking-[-0.03em] text-[#24467e]">{title}</h3>

          <ul className="mt-8 space-y-4">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3 text-[15px] font-semibold text-[#2a4b82]">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${
                    tone === "orange" ? "bg-[#f07b2d]" : "bg-[#2d67c8]"
                  }`}
                >
                  ●
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">{buttonNode}</div>
        </div>

        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#eef5fd_0%,#dfeaf8_100%)]">
          {visual}
        </div>
      </div>
    </div>
  );
}

function AudiencePanel({
  title,
  bullets,
  button,
  buttonHref,
  accent,
  visual,
}: {
  title: string;
  bullets: string[];
  button: string;
  buttonHref: string;
  accent: "orange" | "green";
  visual: React.ReactNode;
}) {
  const titleColor = accent === "green" ? "text-[#3c8c4a]" : "text-[#24467e]";

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#d9e2ec] bg-white shadow-sm">
      <div className="px-7 pt-7">
        <div className={`text-[28px] font-bold tracking-[-0.03em] ${titleColor}`}>{title}</div>
      </div>

      <div className="grid min-h-[234px] grid-cols-1 md:grid-cols-[1fr_0.88fr]">
        <div className="px-7 py-6">
          <ul className="space-y-4">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3 text-[15px] font-semibold text-[#2b4a7d]">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    accent === "green" ? "bg-[#4f9d51]" : "bg-[#24467e]"
                  }`}
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {accent === "green" ? (
              <GreenButton href={buttonHref}>{button}</GreenButton>
            ) : (
              <OrangeButton href={buttonHref}>{button}</OrangeButton>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#eef5fd_0%,#dde9f7_100%)]">
          {visual}
        </div>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" aria-hidden="true">
      <circle cx="27" cy="27" r="27" fill="#E8F1FC" />
      <path d="M27 12l12 5v8c0 8.5-5.5 14.6-12 17-6.5-2.4-12-8.5-12-17v-8l12-5z" fill="#5E94DA" />
      <path d="M27 21l2.5 5.5 6 .8-4.4 4.1 1.1 5.9-5.2-2.8-5.2 2.8 1.1-5.9-4.4-4.1 6-.8L27 21z" fill="white" />
    </svg>
  );
}

function PawIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" aria-hidden="true">
      <circle cx="27" cy="27" r="27" fill="#EEF3FB" />
      <circle cx="19" cy="18" r="5" fill="#6FA1E2" />
      <circle cx="35" cy="18" r="5" fill="#6FA1E2" />
      <circle cx="15" cy="28" r="4.5" fill="#F3B04A" />
      <circle cx="39" cy="28" r="4.5" fill="#F3B04A" />
      <path d="M27 23c-6 0-10 5.2-10 9.2 0 4.3 3.4 6.8 10 6.8s10-2.5 10-6.8c0-4-4-9.2-10-9.2z" fill="#6FA1E2" />
    </svg>
  );
}

function DocCircleIcon() {
  return (
    <svg width="94" height="78" viewBox="0 0 94 78" fill="none" aria-hidden="true">
      <ellipse cx="47" cy="44" rx="33" ry="21" fill="#EAF2FC" />
      <rect x="25" y="17" width="28" height="36" rx="4" fill="white" stroke="#D7E1EE" />
      <rect x="31" y="25" width="17" height="3" rx="1.5" fill="#BFD0E8" />
      <rect x="31" y="31" width="13" height="3" rx="1.5" fill="#BFD0E8" />
      <rect x="31" y="37" width="17" height="3" rx="1.5" fill="#BFD0E8" />
      <circle cx="57" cy="44" r="10" fill="#8D5CF5" />
      <circle cx="57" cy="44" r="5" fill="#FFD15A" />
      <circle cx="49" cy="51" r="4" fill="#F07B2D" />
    </svg>
  );
}

function QrCircleIcon() {
  return (
    <svg width="94" height="78" viewBox="0 0 94 78" fill="none" aria-hidden="true">
      <ellipse cx="47" cy="44" rx="33" ry="21" fill="#EAF2FC" />
      <rect x="28" y="20" width="38" height="38" rx="4" fill="white" stroke="#D7E1EE" />
      <rect x="33" y="25" width="10" height="10" fill="#1C1C1C" />
      <rect x="51" y="25" width="10" height="10" fill="#1C1C1C" />
      <rect x="33" y="43" width="10" height="10" fill="#1C1C1C" />
      <rect x="46" y="38" width="4" height="4" fill="#1C1C1C" />
      <rect x="46" y="46" width="4" height="4" fill="#1C1C1C" />
      <rect x="54" y="38" width="4" height="4" fill="#1C1C1C" />
      <rect x="58" y="46" width="3" height="3" fill="#1C1C1C" />
      <rect x="41" y="33" width="3" height="3" fill="#1C1C1C" />
      <rect x="41" y="50" width="3" height="3" fill="#1C1C1C" />
    </svg>
  );
}

function ProfileCircleIcon() {
  return (
    <svg width="94" height="78" viewBox="0 0 94 78" fill="none" aria-hidden="true">
      <ellipse cx="47" cy="44" rx="33" ry="21" fill="#EAF2FC" />
      <rect x="24" y="20" width="44" height="30" rx="5" fill="white" stroke="#D7E1EE" />
      <rect x="47" y="24" width="17" height="10" rx="2" fill="#F28B66" />
      <rect x="47" y="37" width="14" height="4" rx="2" fill="#C6D5EA" />
      <rect x="47" y="43" width="10" height="4" rx="2" fill="#C6D5EA" />
      <circle cx="35" cy="31" r="6" fill="#6FA1E2" />
      <path d="M27 44c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="#6FA1E2" />
    </svg>
  );
}

function ShareCircleIcon() {
  return (
    <svg width="94" height="78" viewBox="0 0 94 78" fill="none" aria-hidden="true">
      <ellipse cx="47" cy="44" rx="33" ry="21" fill="#EAF2FC" />
      <path d="M27 29l17-8 16 8v12c0 11-7 17-16 20-9-3-17-9-17-20V29z" fill="#62B776" />
      <path d="M36 40l6 6 11-12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="54" y="39" width="11" height="15" rx="2" fill="white" stroke="#D7E1EE" />
      <rect x="56.5" y="42" width="6" height="2.5" rx="1.25" fill="#BFD0E8" />
    </svg>
  );
}

function GrantIcon() {
  return (
    <svg width="98" height="80" viewBox="0 0 98 80" fill="none" aria-hidden="true">
      <ellipse cx="49" cy="47" rx="34" ry="21" fill="#E7F0FB" />
      <rect x="21" y="28" width="34" height="24" rx="5" fill="#6FA1E2" />
      <circle cx="32" cy="40" r="7" fill="white" />
      <rect x="59" y="23" width="17" height="29" rx="4" fill="white" stroke="#D7E1EE" />
      <circle cx="67.5" cy="31" r="5.5" fill="#F4B34D" />
      <rect x="62" y="39" width="11" height="3" rx="1.5" fill="#C6D5EA" />
    </svg>
  );
}

function ImagingIcon() {
  return (
    <svg width="98" height="80" viewBox="0 0 98 80" fill="none" aria-hidden="true">
      <ellipse cx="49" cy="47" rx="34" ry="21" fill="#E7F0FB" />
      <rect x="25" y="22" width="38" height="24" rx="5" fill="white" stroke="#D7E1EE" />
      <rect x="31" y="29" width="25" height="3" rx="1.5" fill="#BFD0E8" />
      <rect x="31" y="35" width="19" height="3" rx="1.5" fill="#BFD0E8" />
      <rect x="48" y="35" width="8" height="3" rx="1.5" fill="#F29A35" />
      <rect x="48" y="41" width="12" height="3" rx="1.5" fill="#BFD0E8" />
      <rect x="54" y="34" width="23" height="19" rx="4" fill="white" stroke="#D7E1EE" />
      <rect x="58" y="39" width="15" height="3" rx="1.5" fill="#BFD0E8" />
      <rect x="58" y="45" width="11" height="3" rx="1.5" fill="#BFD0E8" />
    </svg>
  );
}

function ContinuityIcon() {
  return (
    <svg width="98" height="80" viewBox="0 0 98 80" fill="none" aria-hidden="true">
      <ellipse cx="49" cy="47" rx="34" ry="21" fill="#E7F0FB" />
      <circle cx="43" cy="38" r="12" fill="#E7C38D" />
      <path d="M35 55c2-8 14-8 16 0" fill="#D9B078" />
      <circle cx="60" cy="46" r="12" fill="#365A8C" />
      <path d="M55 46h10" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 41v10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ViewerIcon() {
  return (
    <svg width="98" height="80" viewBox="0 0 98 80" fill="none" aria-hidden="true">
      <ellipse cx="49" cy="47" rx="34" ry="21" fill="#E7F0FB" />
      <rect x="23" y="23" width="48" height="28" rx="5" fill="#2F69C9" />
      <circle cx="47" cy="37" r="8.5" fill="#9FC0F1" />
      <circle cx="47" cy="37" r="3.8" fill="white" />
      <rect x="31" y="56" width="31" height="4" rx="2" fill="#A8BDD9" />
    </svg>
  );
}

function LaptopIcon() {
  return (
    <svg width="98" height="80" viewBox="0 0 98 80" fill="none" aria-hidden="true">
      <ellipse cx="49" cy="47" rx="34" ry="21" fill="#E7F0FB" />
      <rect x="23" y="22" width="40" height="27" rx="4" fill="#365A8C" />
      <rect x="28" y="27" width="30" height="17" rx="2" fill="#E9F1FC" />
      <rect x="19" y="50" width="48" height="5" rx="2.5" fill="#2E4C77" />
      <circle cx="72" cy="47" r="10" fill="#EAF2FC" stroke="#A8BDD9" />
      <path d="M72 42v5h4" stroke="#6FA1E2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeroVisual() {
  return (
    <div className="relative h-[320px] overflow-hidden md:h-[360px]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#e8f2fd_0%,#d6e7fb_100%)]" />

      <svg
        className="absolute bottom-0 left-0 h-[150px] w-full opacity-55"
        viewBox="0 0 700 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 160V82l52-14 22-20 38 8 28-14 29 27 30-7 20-20 48 11 19-30 52 9 25 21 33-10 38 12 26 24 45-12 39 18 31-11 45 19v80H0z"
          fill="#bcd3ef"
        />
        <path
          d="M0 160V97l30-9 30 8 34-16 24 6 34-24 26 10 40-10 36 21 32-8 18-27 49 8 18 16 27-9 25 13 38-18 30 14 45-15 38 17 40-10v83H0z"
          fill="#d2e1f4"
        />
      </svg>

      <div className="absolute left-[18px] top-[102px] rounded-[4px] bg-white p-2 shadow-[0_8px_18px_rgba(0,0,0,0.15)] md:left-[58px] md:top-[120px]">
        <div className="grid grid-cols-7 gap-[2px] bg-white p-1">
          {Array.from({ length: 49 }).map((_, i) => {
            const on = [
              0, 1, 2, 7, 9, 14, 15, 16, 4, 5, 6, 11, 13, 18, 19, 20, 21, 22, 28, 35, 36, 37,
              42, 44, 45, 46, 24, 25, 31, 33, 38, 39, 40,
            ].includes(i);
            return <div key={i} className={`h-[5px] w-[5px] ${on ? "bg-black" : "bg-white"}`} />;
          })}
        </div>
      </div>

      <div className="absolute left-[140px] top-[18px] h-[260px] w-[130px] rounded-[26px] border-[6px] border-[#1d1d1d] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.25)] md:left-[200px] md:top-[20px] md:h-[285px] md:w-[142px]">
        <div className="mx-auto mt-2 h-[5px] w-14 rounded-full bg-black/70" />
        <div className="overflow-hidden rounded-[20px] bg-[#f6f9fe] px-2 pt-2">
          <div className="rounded-[14px] bg-[#2d67c8] px-2 py-2 text-white">
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-80">
              UNIMALIA
            </div>
            <div className="mt-1 text-[10px] font-semibold">Scheda digitale</div>
          </div>

          <div className="mt-2 rounded-[14px] bg-white p-2 shadow-sm">
            <div className="flex gap-2">
              <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_45%_40%,#f6d8a5_0%,#e4ba74_62%,#c98f45_100%)]" />
              <div className="flex-1">
                <div className="h-2 w-10 rounded-full bg-[#bfd0e8]" />
                <div className="mt-1 h-2 w-14 rounded-full bg-[#d5e1f1]" />
                <div className="mt-2 h-2 w-8 rounded-full bg-[#f3b04a]" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-2 rounded-full bg-[#edf3fb]" />
              <div className="h-2 w-11/12 rounded-full bg-[#edf3fb]" />
              <div className="h-2 w-9/12 rounded-full bg-[#edf3fb]" />
              <div className="h-2 w-10/12 rounded-full bg-[#edf3fb]" />
              <div className="h-2 w-7/12 rounded-full bg-[#edf3fb]" />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-2 py-2 text-[10px] text-[#5a7197]">
            <span>○</span>
            <span>◻</span>
            <span>⌂</span>
          </div>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 h-[315px] w-[250px] md:h-[350px] md:w-[310px]">
        <div className="absolute bottom-0 right-4 h-[270px] w-[210px] rounded-t-[120px] rounded-b-[14px] bg-[radial-gradient(circle_at_45%_30%,#fbe8c7_0%,#e6bc76_55%,#ce9448_100%)] md:h-[320px] md:w-[250px]">
          <div className="absolute left-[34px] top-[40px] h-[74px] w-[82px] rounded-full bg-[radial-gradient(circle_at_45%_40%,#f7ddb4_0%,#e6be7f_62%,#d29b52_100%)]" />
          <div className="absolute right-[28px] top-[46px] h-[88px] w-[94px] rounded-full bg-[radial-gradient(circle_at_50%_38%,#f7ddb4_0%,#e6be7f_62%,#d29b52_100%)]" />
          <div className="absolute left-[58px] top-[78px] h-[120px] w-[118px] rounded-full bg-[radial-gradient(circle_at_45%_35%,#f7ddb4_0%,#e6be7f_62%,#d29b52_100%)]" />
          <div className="absolute left-[92px] top-[112px] h-[22px] w-[26px] rounded-full bg-[#272727]" />
          <div className="absolute left-[77px] top-[136px] h-[14px] w-[56px] rounded-full bg-[#7c4230]" />
          <div className="absolute left-[83px] top-[160px] h-[9px] w-[30px] rounded-full bg-[#ef7c74]" />
          <div className="absolute left-[68px] top-[124px] h-[11px] w-[11px] rounded-full bg-[#272727]" />
          <div className="absolute right-[63px] top-[126px] h-[11px] w-[11px] rounded-full bg-[#272727]" />
          <div className="absolute left-[102px] top-[183px] h-[18px] w-[18px] rounded-full bg-[#1778dc]" />
          <div className="absolute left-[95px] top-[177px] h-[6px] w-[30px] rounded-full border-2 border-[#2a2a2a] border-b-0 rounded-t-full" />
        </div>
      </div>
    </div>
  );
}

function DogCardVisual() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#edf5fe_0%,#dfeaf8_100%)]" />
      <svg
        className="absolute bottom-0 left-0 h-[110px] w-full opacity-40"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 120V65l30-8 28-16 30 7 22-15 39 9 25-20 36 10 24 16 39-7 23 17 32-10 38 15v57H0z" fill="#c6d9ef" />
      </svg>

      <div className="absolute bottom-0 right-6 h-[170px] w-[145px] rounded-t-[70px] rounded-b-[10px] bg-[radial-gradient(circle_at_45%_30%,#fbe8c7_0%,#e6bc76_55%,#ce9448_100%)]">
        <div className="absolute left-[16px] top-[24px] h-[48px] w-[54px] rounded-full bg-[radial-gradient(circle_at_45%_40%,#f7ddb4_0%,#e6be7f_62%,#d29b52_100%)]" />
        <div className="absolute right-[15px] top-[26px] h-[52px] w-[58px] rounded-full bg-[radial-gradient(circle_at_50%_38%,#f7ddb4_0%,#e6be7f_62%,#d29b52_100%)]" />
        <div className="absolute left-[30px] top-[48px] h-[75px] w-[80px] rounded-full bg-[radial-gradient(circle_at_45%_35%,#f7ddb4_0%,#e6be7f_62%,#d29b52_100%)]" />
        <div className="absolute left-[54px] top-[72px] h-[10px] w-[12px] rounded-full bg-[#272727]" />
        <div className="absolute left-[40px] top-[84px] h-[7px] w-[30px] rounded-full bg-[#7c4230]" />
        <div className="absolute left-[45px] top-[98px] h-[10px] w-[10px] rounded-full bg-[#1778dc]" />
      </div>
    </div>
  );
}

function PapersVisual() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#edf5fe_0%,#dfeaf8_100%)]" />
      <div className="absolute left-[72px] top-[34px] h-[132px] w-[96px] rotate-[-4deg] rounded-[6px] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.12)]" />
      <div className="absolute left-[110px] top-[26px] h-[142px] w-[108px] rotate-[5deg] rounded-[6px] bg-[#f8fbff] shadow-[0_10px_20px_rgba(0,0,0,0.12)]" />
      <div className="absolute left-[140px] top-[52px] h-[12px] w-[44px] rounded bg-[#bfd0e8]" />
      <div className="absolute left-[140px] top-[73px] h-[8px] w-[68px] rounded bg-[#d4deee]" />
      <div className="absolute left-[140px] top-[90px] h-[8px] w-[54px] rounded bg-[#d4deee]" />
      <div className="absolute left-[133px] top-[114px] flex h-10 w-10 items-center justify-center rounded-lg bg-[#f07b2d] text-white shadow-lg">
        ▣
      </div>
      <div className="absolute left-[182px] top-[126px] flex h-10 w-10 items-center justify-center rounded-full bg-[#f2b04c] text-white shadow-lg">
        →
      </div>
    </div>
  );
}

function VetVisual() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#edf5fe_0%,#dde9f7_100%)]" />
      <div className="absolute left-6 top-[30px] h-[132px] w-[84px] rounded-[10px] bg-white shadow-md" />
      <div className="absolute left-10 top-[44px] h-[12px] w-[46px] rounded bg-[#bfd0e8]" />
      <div className="absolute left-10 top-[64px] h-[8px] w-[56px] rounded bg-[#d5dfef]" />
      <div className="absolute left-10 top-[80px] h-[8px] w-[46px] rounded bg-[#d5dfef]" />
      <div className="absolute left-10 top-[96px] h-[8px] w-[36px] rounded bg-[#d5dfef]" />
      <div className="absolute left-[88px] top-[18px] flex h-12 w-12 items-center justify-center rounded-[10px] bg-white text-[#7bc6dd] shadow-md">
        ✚
      </div>

      <div className="absolute right-6 bottom-0 h-[190px] w-[130px]">
        <div className="absolute left-[38px] top-[18px] h-[44px] w-[44px] rounded-full bg-[#eac08b]" />
        <div className="absolute left-[18px] top-[56px] h-[118px] w-[90px] rounded-t-[44px] rounded-b-[10px] bg-white" />
        <div className="absolute left-[8px] top-[72px] h-[70px] w-[44px] rounded-[10px] bg-[#dbe8f7]" />
        <div className="absolute left-[46px] top-[88px] h-[30px] w-[44px] rounded-[8px] bg-[#a7c5e7]" />
      </div>
    </div>
  );
}

function PetVisual() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f1faf2_0%,#e1f0e1_100%)]" />
      <svg
        className="absolute bottom-0 left-0 h-[90px] w-full opacity-35"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 100V56l28-8 36 8 30-16 26 10 30-12 25 18 44-12 30 16 38-10 27 14 40-12 46 18v30H0z" fill="#b9d9b8" />
      </svg>

      <div className="absolute left-[30px] top-[34px] flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#5dbb62] text-white shadow-md">
        ✓
      </div>
      <div className="absolute left-[54px] top-[88px] flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#f07b2d] text-white shadow-md">
        ✓
      </div>

      <div className="absolute right-6 bottom-0 h-[186px] w-[132px]">
        <div className="absolute left-[38px] top-[20px] h-[46px] w-[46px] rounded-full bg-[#efbf98]" />
        <div className="absolute left-[22px] top-[58px] h-[118px] w-[88px] rounded-t-[40px] rounded-b-[10px] bg-[#3aa0d8]" />
        <div className="absolute left-[6px] top-[106px] h-[42px] w-[44px] rounded-t-[24px] rounded-b-[10px] bg-[#f0b36a]" />
        <div className="absolute left-[20px] top-[94px] h-[16px] w-[16px] rounded-full bg-[#5d4635]" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-[#f6f2ea] pb-16">
      <SectionShell className="pt-6 md:pt-8">
        <div className="overflow-hidden rounded-[4px] border border-[#dbe3ec] bg-white shadow-sm">
          <div className="grid min-h-[320px] grid-cols-1 md:grid-cols-[1.08fr_0.92fr]">
            <div className="bg-[linear-gradient(180deg,#eef5fe_0%,#dfeaf8_100%)] px-8 py-10 md:px-12 md:py-12">
              <h1 className="max-w-[520px] text-[42px] font-extrabold leading-[1.08] tracking-[-0.045em] text-[#2b4f87] md:text-[58px]">
                L’identità digitale che segue ogni animale, ovunque.
              </h1>

              <p className="mt-7 max-w-[500px] text-[19px] leading-relaxed text-[#536a8f]">
                Unimalia è l’infrastruttura digitale nazionale che connette proprietari,
                veterinari e professionals del mondo pet.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <OrangeButton href="/identita/nuovo">Crea l'identità digitale del tuo animale</OrangeButton>
                <WhiteButton href="/identita">Scopri come funziona</WhiteButton>
              </div>
            </div>

            <HeroVisual />
          </div>
        </div>
      </SectionShell>

      <div className="mt-0 border-y border-[#dee4ea] bg-[#f8fafc]">
        <SectionShell>
          <div className="grid grid-cols-1 divide-y divide-[#e3e8ef] md:grid-cols-3 md:divide-x md:divide-y-0">
            <MiniFeature icon={<ShieldIcon />} title="Frammentazione dei" subtitle="dati - Risolta" />
            <MiniFeature icon={<PawIcon />} title="Smarrimenti e Adozioni" subtitle="Centralizzati" />
            <MiniFeature icon={<ShieldIcon />} title="Cartella Clinica" subtitle="Interoperabile" />
          </div>
        </SectionShell>
      </div>

      <SectionShell className="pt-10 md:pt-14">
        <div className="rounded-[4px] bg-white px-6 py-10 text-center">
          <h2 className="text-[34px] font-bold tracking-[-0.04em] text-[#24467e]">
            Identità Digitale dell’Animale
          </h2>

          <div className="mx-auto mt-9 grid max-w-[900px] grid-cols-2 gap-y-8 md:grid-cols-4">
            <FeatureTile icon={<DocCircleIcon />} title="Identificativo Unimale" />
            <FeatureTile icon={<QrCircleIcon />} title="QR Code Universale" />
            <FeatureTile icon={<ProfileCircleIcon />} title="Profilo Completo" />
            <FeatureTile icon={<ShareCircleIcon />} title="Condivisione Controllata" />
          </div>

          <div className="mt-8">
            <OrangeButton href="/identita/nuovo">Crea l'identità digitale</OrangeButton>
          </div>
        </div>
      </SectionShell>

      <div className="mt-6 bg-[linear-gradient(180deg,#edf5fe_0%,#e8f1fb_100%)] py-10 md:py-12">
        <SectionShell>
          <div className="text-center">
            <h2 className="text-[34px] font-bold tracking-[-0.04em] text-[#24467e]">
              Cartella Clinica Digitale Continua
            </h2>
          </div>

          <div className="mx-auto mt-9 grid max-w-[980px] grid-cols-2 gap-y-8 md:grid-cols-5">
            <FeatureTile icon={<GrantIcon />} title="Grant System" />
            <FeatureTile icon={<ImagingIcon />} title="Referti e Imaging" />
            <FeatureTile icon={<ContinuityIcon />} title="Continuità Assistenziale" />
            <FeatureTile icon={<ViewerIcon />} title="Viewer Avancato" />
            <FeatureTile icon={<LaptopIcon />} title="" />
          </div>

          <div className="mt-8 text-center">
            <BlueButton href="/professionisti/dashboard">Come funziona la cartella clinica</BlueButton>
          </div>
        </SectionShell>
      </div>

      <SectionShell className="pt-10 md:pt-12">
        <div className="grid gap-6 md:grid-cols-2">
          <BulletPanel
            title="Smarrimenti e Ritrovamenti"
            bullets={["Mappa Nazionale", "Matching Automatico", "Segnalazioni Geolocalizzate"]}
            button="Segnala uno Smarrimento"
            buttonHref="/smarrimenti/nuovo"
            tone="orange"
            visual={<DogCardVisual />}
          />

          <BulletPanel
            title="Adozioni e Passaggi di Proprietà"
            bullets={["Processo Standardizzato", "Documentazione Digitale", "Tracciabilità Completa"]}
            button="Vai alle Adozioni"
            buttonHref="/adozioni"
            tone="blue"
            visual={<PapersVisual />}
          />
        </div>
      </SectionShell>

      <div className="mt-8 bg-[linear-gradient(180deg,#edf5fe_0%,#e9f2fb_100%)] py-10 md:py-12">
        <SectionShell>
          <div className="grid gap-6 md:grid-cols-2">
            <AudiencePanel
              title="Area Veterinari"
              bullets={[
                "Cartella Clinica Condivisa",
                "Imaging Diagnostico",
                "Consulto tra Cliniche",
                "Interoperabilità",
              ]}
              button="Accedi a Unimalia Professionisti"
              buttonHref="/professionisti/login"
              accent="orange"
              visual={<VetVisual />}
            />

            <AudiencePanel
              title="Professionisti Pet"
              bullets={["Cartella Storica", "Tracciamento Servizi", "Gestione Clienti", "Recensioni"]}
              button="Accedi a Unimalia Professionisti"
              buttonHref="/professionisti/login"
              accent="green"
              visual={<PetVisual />}
            />
          </div>
        </SectionShell>
      </div>

      <SectionShell className="pt-10 md:pt-14">
        <div className="border-t border-[#dfe4ea] px-4 pt-10 text-center">
          <h2 className="text-[26px] font-bold tracking-[-0.03em] text-[#24467e] md:text-[34px]">
            Unimalia — L'infrastruttura digitale per il mondo animale.
          </h2>

          <div className="mt-8">
            <BlueButton href="/identita/nuovo">Inizia Ora</BlueButton>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}