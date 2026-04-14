import type { Metadata } from "next";
import Image from "next/image";
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

function HeaderButton({
  href,
  children,
  dark = false,
}: {
  href: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition",
        dark
          ? "bg-black text-white hover:bg-zinc-800"
          : "bg-white text-zinc-900 ring-1 ring-black/10 hover:bg-zinc-50",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function OrangeButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md bg-[#ef7a2f] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(239,122,47,0.28)] transition hover:bg-[#dd6920]"
    >
      {children}
    </Link>
  );
}

function BlueButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md bg-[#2d67c7] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(45,103,199,0.25)] transition hover:bg-[#2458ab]"
    >
      {children}
    </Link>
  );
}

function GreenButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md bg-[#4a9b53] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(74,155,83,0.25)] transition hover:bg-[#3f8847]"
    >
      {children}
    </Link>
  );
}

function LightButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md border border-[#d7dfec] bg-white px-6 text-sm font-semibold text-[#284b84] shadow-sm transition hover:bg-[#f8fbff]"
    >
      {children}
    </Link>
  );
}

function SectionContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`mx-auto w-full max-w-[1180px] px-4 ${className}`}>{children}</section>;
}

function TopFeature({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4 px-4 py-5 text-center md:text-left">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-[15px] font-semibold leading-tight text-[#2a4b82]">{title}</p>
        <p className="text-[15px] font-semibold leading-tight text-[#2a4b82]">{subtitle}</p>
      </div>
    </div>
  );
}

function CircleIconWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[84px] w-[96px] items-center justify-center">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#edf4fd] shadow-sm">
        {children}
      </div>
    </div>
  );
}

function CenterFeature({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center">
      {icon}
      <p className="mt-3 text-center text-[13px] font-semibold text-[#314d7a]">{title}</p>
    </div>
  );
}

function TwoColumnPanel({
  title,
  bullets,
  button,
  buttonHref,
  buttonTone,
  visual,
}: {
  title: string;
  bullets: string[];
  button: string;
  buttonHref: string;
  buttonTone: "orange" | "blue";
  visual: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[4px] border border-[#d9e2ec] bg-white shadow-sm">
      <div className="grid min-h-[252px] grid-cols-1 md:grid-cols-[1fr_0.92fr]">
        <div className="bg-[linear-gradient(180deg,#eef5fd_0%,#f7fbff_100%)] px-7 py-7">
          <h3 className="text-[26px] font-bold tracking-[-0.03em] text-[#24467e]">{title}</h3>

          <div className="mt-7 space-y-4">
            {bullets.map((bullet, index) => (
              <div key={bullet} className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white",
                    buttonTone === "orange" ? "bg-[#ef7a2f]" : "bg-[#2d67c7]",
                  ].join(" ")}
                >
                  {index + 1}
                </div>
                <p className="text-[15px] font-semibold text-[#2a4b82]">{bullet}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            {buttonTone === "orange" ? (
              <OrangeButton href={buttonHref}>{button}</OrangeButton>
            ) : (
              <BlueButton href={buttonHref}>{button}</BlueButton>
            )}
          </div>
        </div>

        <div className="relative min-h-[230px] overflow-hidden bg-[linear-gradient(180deg,#eef5fd_0%,#dfeaf8_100%)]">
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
  tone,
  visual,
}: {
  title: string;
  bullets: string[];
  button: string;
  buttonHref: string;
  tone: "orange" | "green";
  visual: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[4px] border border-[#d9e2ec] bg-white shadow-sm">
      <div className="px-7 pt-7">
        <h3
          className={[
            "text-[28px] font-bold tracking-[-0.03em]",
            tone === "green" ? "text-[#3f8c49]" : "text-[#24467e]",
          ].join(" ")}
        >
          {title}
        </h3>
      </div>

      <div className="grid min-h-[236px] grid-cols-1 md:grid-cols-[1fr_0.92fr]">
        <div className="px-7 py-6">
          <div className="space-y-4">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-center gap-3">
                <div
                  className={[
                    "h-2.5 w-2.5 rounded-full",
                    tone === "green" ? "bg-[#4a9b53]" : "bg-[#24467e]",
                  ].join(" ")}
                />
                <p className="text-[15px] font-semibold text-[#2a4b82]">{bullet}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            {tone === "green" ? (
              <GreenButton href={buttonHref}>{button}</GreenButton>
            ) : (
              <OrangeButton href={buttonHref}>{button}</OrangeButton>
            )}
          </div>
        </div>

        <div className="relative min-h-[220px] overflow-hidden bg-[linear-gradient(180deg,#eef5fd_0%,#dfeaf8_100%)]">
          {visual}
        </div>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" aria-hidden="true">
      <circle cx="27" cy="27" r="27" fill="#EAF2FD" />
      <path d="M27 12l12 5v8c0 8.5-5.5 14.5-12 17-6.5-2.5-12-8.5-12-17v-8l12-5z" fill="#6396DB" />
      <path
        d="M27 21l2.5 5.3 5.8.8-4.2 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.2-4 5.8-.8L27 21z"
        fill="white"
      />
    </svg>
  );
}

function PawIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" aria-hidden="true">
      <circle cx="27" cy="27" r="27" fill="#EEF4FD" />
      <circle cx="19" cy="18" r="5" fill="#6C9FE1" />
      <circle cx="35" cy="18" r="5" fill="#6C9FE1" />
      <circle cx="15" cy="28" r="4.5" fill="#F2B24C" />
      <circle cx="39" cy="28" r="4.5" fill="#F2B24C" />
      <path d="M27 23c-5.8 0-10 5.1-10 9.2 0 4.2 3.5 6.8 10 6.8s10-2.6 10-6.8c0-4.1-4.2-9.2-10-9.2z" fill="#6C9FE1" />
    </svg>
  );
}

function DocIllustration() {
  return (
    <CircleIconWrap>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
        <rect x="10" y="8" width="22" height="28" rx="4" fill="white" stroke="#D5E0EE" />
        <rect x="14" y="14" width="14" height="3" rx="1.5" fill="#BFD0E8" />
        <rect x="14" y="20" width="11" height="3" rx="1.5" fill="#BFD0E8" />
        <rect x="14" y="26" width="14" height="3" rx="1.5" fill="#BFD0E8" />
        <circle cx="35" cy="34" r="8" fill="#8F61F4" />
        <circle cx="35" cy="34" r="4" fill="#FFD663" />
        <circle cx="30" cy="39" r="4" fill="#EF7A2F" />
      </svg>
    </CircleIconWrap>
  );
}

function QrIllustration() {
  return (
    <CircleIconWrap>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
        <rect x="9" y="9" width="34" height="34" rx="4" fill="white" stroke="#D5E0EE" />
        <rect x="14" y="14" width="9" height="9" fill="#111" />
        <rect x="29" y="14" width="9" height="9" fill="#111" />
        <rect x="14" y="29" width="9" height="9" fill="#111" />
        <rect x="25" y="24" width="4" height="4" fill="#111" />
        <rect x="31" y="25" width="3" height="3" fill="#111" />
        <rect x="24" y="33" width="4" height="4" fill="#111" />
        <rect x="31" y="33" width="4" height="4" fill="#111" />
      </svg>
    </CircleIconWrap>
  );
}

function ProfileIllustration() {
  return (
    <CircleIconWrap>
      <svg width="54" height="52" viewBox="0 0 54 52" fill="none" aria-hidden="true">
        <rect x="6" y="11" width="40" height="26" rx="5" fill="white" stroke="#D5E0EE" />
        <rect x="29" y="15" width="13" height="9" rx="2" fill="#EE8D68" />
        <rect x="29" y="28" width="11" height="3" rx="1.5" fill="#C4D5EA" />
        <circle cx="19" cy="22" r="6" fill="#6C9FE1" />
        <path d="M11 34c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="#6C9FE1" />
      </svg>
    </CircleIconWrap>
  );
}

function ShareIllustration() {
  return (
    <CircleIconWrap>
      <svg width="54" height="52" viewBox="0 0 54 52" fill="none" aria-hidden="true">
        <path d="M12 18l15-7 15 7v11c0 10.5-6.7 16.2-15 19-8.3-2.8-15-8.5-15-19V18z" fill="#62B777" />
        <path d="M20 29l5 5 10-11" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="33" y="26" width="10" height="14" rx="2" fill="white" stroke="#D5E0EE" />
      </svg>
    </CircleIconWrap>
  );
}

function GrantIllustration() {
  return (
    <CircleIconWrap>
      <svg width="58" height="50" viewBox="0 0 58 50" fill="none" aria-hidden="true">
        <rect x="8" y="18" width="24" height="18" rx="4" fill="#6C9FE1" />
        <circle cx="18" cy="27" r="5" fill="white" />
        <rect x="36" y="12" width="14" height="24" rx="4" fill="white" stroke="#D5E0EE" />
        <circle cx="43" cy="19" r="5" fill="#F2B24C" />
      </svg>
    </CircleIconWrap>
  );
}

function ImagingIllustration() {
  return (
    <CircleIconWrap>
      <svg width="58" height="50" viewBox="0 0 58 50" fill="none" aria-hidden="true">
        <rect x="9" y="12" width="26" height="18" rx="4" fill="white" stroke="#D5E0EE" />
        <rect x="14" y="17" width="17" height="3" rx="1.5" fill="#C3D4E9" />
        <rect x="14" y="22" width="11" height="3" rx="1.5" fill="#C3D4E9" />
        <rect x="30" y="22" width="5" height="3" rx="1.5" fill="#F2B24C" />
        <rect x="27" y="24" width="22" height="17" rx="4" fill="white" stroke="#D5E0EE" />
      </svg>
    </CircleIconWrap>
  );
}

function ContinuityIllustration() {
  return (
    <CircleIconWrap>
      <svg width="58" height="50" viewBox="0 0 58 50" fill="none" aria-hidden="true">
        <circle cx="23" cy="25" r="9" fill="#E7C490" />
        <circle cx="38" cy="30" r="10" fill="#355988" />
        <path d="M33 30h10" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M38 25v10" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </CircleIconWrap>
  );
}

function ViewerIllustration() {
  return (
    <CircleIconWrap>
      <svg width="60" height="50" viewBox="0 0 60 50" fill="none" aria-hidden="true">
        <rect x="7" y="12" width="34" height="20" rx="4" fill="#2E68C8" />
        <circle cx="24" cy="22" r="7.5" fill="#9FC1F2" />
        <circle cx="24" cy="22" r="3.2" fill="white" />
        <rect x="13" y="38" width="22" height="4" rx="2" fill="#A7BDD9" />
      </svg>
    </CircleIconWrap>
  );
}

function LaptopIllustration() {
  return (
    <CircleIconWrap>
      <svg width="60" height="50" viewBox="0 0 60 50" fill="none" aria-hidden="true">
        <rect x="8" y="12" width="28" height="18" rx="3" fill="#365A8C" />
        <rect x="11" y="15" width="22" height="12" rx="2" fill="#E9F1FC" />
        <rect x="5" y="31" width="34" height="4" rx="2" fill="#2F4C76" />
        <circle cx="46" cy="28" r="8" fill="#EAF2FC" stroke="#A8BDD9" />
      </svg>
    </CircleIconWrap>
  );
}

function HeroVisual() {
  return (
    <div className="relative h-[320px] overflow-hidden md:h-[360px]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#e8f2fd_0%,#d6e7fb_100%)]" />

      <svg
        className="absolute bottom-0 left-0 h-[155px] w-full opacity-60"
        viewBox="0 0 700 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 160V82l52-14 22-20 38 8 28-14 29 27 30-7 20-20 48 11 19-30 52 9 25 21 33-10 38 12 26 24 45-12 39 18 31-11 45 19v80H0z"
          fill="#b9cfea"
        />
        <path
          d="M0 160V97l30-9 30 8 34-16 24 6 34-24 26 10 40-10 36 21 32-8 18-27 49 8 18 16 27-9 25 13 38-18 30 14 45-15 38 17 40-10v83H0z"
          fill="#d3e1f3"
        />
      </svg>

      <div className="absolute left-[18px] top-[112px] rounded-[4px] bg-white p-2 shadow-[0_8px_18px_rgba(0,0,0,0.15)] md:left-[58px] md:top-[118px]">
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

      <div className="absolute left-[145px] top-[24px] h-[252px] w-[128px] rounded-[26px] border-[6px] border-[#191919] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.25)] md:left-[215px] md:top-[18px] md:h-[292px] md:w-[146px]">
        <div className="mx-auto mt-2 h-[5px] w-14 rounded-full bg-black/70" />
        <div className="overflow-hidden rounded-[20px] bg-[#f7fbff] px-2 pt-2">
          <div className="rounded-[14px] bg-[#2d67c7] px-2 py-2 text-white">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-80">UNIMALIA</p>
            <p className="mt-1 text-[10px] font-semibold">Scheda digitale</p>
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

      <div className="absolute right-0 bottom-0 h-[320px] w-[248px] md:h-[350px] md:w-[310px]">
        <div className="absolute right-4 bottom-0 h-[280px] w-[212px] rounded-t-[120px] rounded-b-[14px] bg-[radial-gradient(circle_at_45%_30%,#fbe8c7_0%,#e6bc76_55%,#ce9448_100%)] md:h-[325px] md:w-[252px]">
          <div className="absolute left-[34px] top-[40px] h-[72px] w-[82px] rounded-full bg-[radial-gradient(circle_at_45%_40%,#f7ddb4_0%,#e6be7f_62%,#d29b52_100%)]" />
          <div className="absolute right-[28px] top-[46px] h-[88px] w-[94px] rounded-full bg-[radial-gradient(circle_at_50%_38%,#f7ddb4_0%,#e6be7f_62%,#d29b52_100%)]" />
          <div className="absolute left-[58px] top-[78px] h-[120px] w-[118px] rounded-full bg-[radial-gradient(circle_at_45%_35%,#f7ddb4_0%,#e6be7f_62%,#d29b52_100%)]" />
          <div className="absolute left-[92px] top-[112px] h-[22px] w-[26px] rounded-full bg-[#252525]" />
          <div className="absolute left-[76px] top-[136px] h-[14px] w-[56px] rounded-full bg-[#7c4230]" />
          <div className="absolute left-[84px] top-[159px] h-[10px] w-[29px] rounded-full bg-[#ef7c74]" />
          <div className="absolute left-[68px] top-[124px] h-[11px] w-[11px] rounded-full bg-[#252525]" />
          <div className="absolute right-[64px] top-[126px] h-[11px] w-[11px] rounded-full bg-[#252525]" />
          <div className="absolute left-[102px] top-[182px] h-[18px] w-[18px] rounded-full bg-[#1778dc]" />
          <div className="absolute left-[95px] top-[176px] h-[6px] w-[30px] rounded-t-full border-2 border-[#2a2a2a] border-b-0" />
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

      <div className="absolute right-6 bottom-0 h-[170px] w-[145px] rounded-t-[70px] rounded-b-[10px] bg-[radial-gradient(circle_at_45%_30%,#fbe8c7_0%,#e6bc76_55%,#ce9448_100%)]">
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
      <div className="absolute left-[133px] top-[114px] flex h-10 w-10 items-center justify-center rounded-lg bg-[#ef7a2f] text-white shadow-lg">
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
      <div className="absolute left-[54px] top-[88px] flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#ef7a2f] text-white shadow-md">
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
    <div className="min-h-screen bg-[#f5f2ea] text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f5f2ea]/92 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-6 px-4 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <Image
                src="/logo-main.png"
                alt="UNIMALIA"
                width={92}
                height={84}
                className="h-8 w-auto"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                UNIMALIA
              </p>
              <p className="truncate text-sm font-medium text-zinc-800">
                Identità digitale animale
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <Link href="/smarrimenti" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              Smarrimenti
            </Link>
            <Link href="/trovati" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              Trovati / Avvistati
            </Link>
            <Link href="/lieti-fine" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              Lieti Fine
            </Link>
            <Link href="/adotta" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              Adozioni
            </Link>
            <Link href="/servizi" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              Servizi
            </Link>
            <Link href="/identita" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              Identità animale
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <HeaderButton href="/professionisti/login" dark>
              Area professionisti
            </HeaderButton>
            <HeaderButton href="/prezzi">Prezzi</HeaderButton>
          </div>
        </div>
      </header>

      <SectionContainer className="pt-6 md:pt-8">
        <div className="overflow-hidden rounded-[4px] border border-[#dbe3ec] bg-white shadow-sm">
          <div className="grid min-h-[320px] grid-cols-1 md:grid-cols-[1.08fr_0.92fr]">
            <div className="bg-[linear-gradient(180deg,#eef5fe_0%,#dfeaf8_100%)] px-8 py-10 md:px-12 md:py-12">
              <h1 className="max-w-[540px] text-[42px] font-extrabold leading-[1.08] tracking-[-0.05em] text-[#2b4f87] md:text-[58px]">
                L’identità digitale che segue ogni animale, ovunque.
              </h1>

              <p className="mt-7 max-w-[510px] text-[18px] leading-relaxed text-[#536a8f] md:text-[19px]">
                Unimalia è l’infrastruttura digitale nazionale che connette proprietari,
                veterinari e professionals del mondo pet.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <OrangeButton href="/identita/nuovo">
                  Crea l'identità digitale del tuo animale
                </OrangeButton>
                <LightButton href="/identita">Scopri come funziona</LightButton>
              </div>
            </div>

            <HeroVisual />
          </div>
        </div>
      </SectionContainer>

      <div className="border-y border-[#dee4ea] bg-[#f8fafc]">
        <SectionContainer>
          <div className="grid grid-cols-1 divide-y divide-[#e3e8ef] md:grid-cols-3 md:divide-x md:divide-y-0">
            <TopFeature icon={<ShieldIcon />} title="Frammentazione dei" subtitle="dati - Risolta" />
            <TopFeature icon={<PawIcon />} title="Smarrimenti e Adozioni" subtitle="Centralizzati" />
            <TopFeature icon={<ShieldIcon />} title="Cartella Clinica" subtitle="Interoperabile" />
          </div>
        </SectionContainer>
      </div>

      <SectionContainer className="pt-10 md:pt-14">
        <div className="rounded-[4px] bg-white px-6 py-10 text-center">
          <h2 className="text-[34px] font-bold tracking-[-0.04em] text-[#24467e]">
            Identità Digitale dell’Animale
          </h2>

          <div className="mx-auto mt-9 grid max-w-[920px] grid-cols-2 gap-y-8 md:grid-cols-4">
            <CenterFeature icon={<DocIllustration />} title="Identificativo Unimale" />
            <CenterFeature icon={<QrIllustration />} title="QR Code Universale" />
            <CenterFeature icon={<ProfileIllustration />} title="Profilo Completo" />
            <CenterFeature icon={<ShareIllustration />} title="Condivisione Controllata" />
          </div>

          <div className="mt-8">
            <OrangeButton href="/identita/nuovo">Crea l'identità digitale</OrangeButton>
          </div>
        </div>
      </SectionContainer>

      <div className="mt-6 bg-[linear-gradient(180deg,#edf5fe_0%,#e8f1fb_100%)] py-10 md:py-12">
        <SectionContainer>
          <div className="text-center">
            <h2 className="text-[34px] font-bold tracking-[-0.04em] text-[#24467e]">
              Cartella Clinica Digitale Continua
            </h2>
          </div>

          <div className="mx-auto mt-9 grid max-w-[980px] grid-cols-2 gap-y-8 md:grid-cols-5">
            <CenterFeature icon={<GrantIllustration />} title="Grant System" />
            <CenterFeature icon={<ImagingIllustration />} title="Referti e Imaging" />
            <CenterFeature icon={<ContinuityIllustration />} title="Continuità Assistenziale" />
            <CenterFeature icon={<ViewerIllustration />} title="Viewer Avancato" />
            <CenterFeature icon={<LaptopIllustration />} title="" />
          </div>

          <div className="mt-8 text-center">
            <BlueButton href="/professionisti/dashboard">Come funziona la cartella clinica</BlueButton>
          </div>
        </SectionContainer>
      </div>

      <SectionContainer className="pt-10 md:pt-12">
        <div className="grid gap-6 md:grid-cols-2">
          <TwoColumnPanel
            title="Smarrimenti e Ritrovamenti"
            bullets={["Mappa Nazionale", "Matching Automatico", "Segnalazioni Geolocalizzate"]}
            button="Segnala uno Smarrimento"
            buttonHref="/smarrimenti/nuovo"
            buttonTone="orange"
            visual={<DogCardVisual />}
          />

          <TwoColumnPanel
            title="Adozioni e Passaggi di Proprietà"
            bullets={["Processo Standardizzato", "Documentazione Digitale", "Tracciabilità Completa"]}
            button="Vai alle Adozioni"
            buttonHref="/adotta"
            buttonTone="blue"
            visual={<PapersVisual />}
          />
        </div>
      </SectionContainer>

      <div className="mt-8 bg-[linear-gradient(180deg,#edf5fe_0%,#e9f2fb_100%)] py-10 md:py-12">
        <SectionContainer>
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
              tone="orange"
              visual={<VetVisual />}
            />

            <AudiencePanel
              title="Professionisti Pet"
              bullets={[
                "Cartella Storica",
                "Tracciamento Servizi",
                "Gestione Clienti",
                "Recensioni",
              ]}
              button="Accedi a Unimalia Professionisti"
              buttonHref="/professionisti/login"
              tone="green"
              visual={<PetVisual />}
            />
          </div>
        </SectionContainer>
      </div>

      <SectionContainer className="pt-10 pb-16 md:pt-14 md:pb-20">
        <div className="border-t border-[#dfe4ea] px-4 pt-10 text-center">
          <h2 className="text-[26px] font-bold tracking-[-0.03em] text-[#24467e] md:text-[34px]">
            Unimalia — L'infrastruttura digitale per il mondo animale.
          </h2>

          <div className="mt-8">
            <BlueButton href="/identita/nuovo">Inizia Ora</BlueButton>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}