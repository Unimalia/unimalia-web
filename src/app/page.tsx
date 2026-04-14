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

function SectionImage({
  src,
  alt,
  children,
  priority = false,
}: {
  src: string;
  alt: string;
  children?: React.ReactNode;
  priority?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[4px] border border-[#dbe3ec] bg-white shadow-sm">
      <Image
        src={src}
        alt={alt}
        width={1365}
        height={403}
        priority={priority}
        className="h-auto w-full"
      />
      {children}
    </div>
  );
}

function Hotspot({
  href,
  label,
  left,
  top,
  width,
  height,
}: {
  href: string;
  label: string;
  left: string;
  top: string;
  width: string;
  height: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="absolute block rounded-md"
      style={{ left, top, width, height }}
    />
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f2ea] py-6 md:py-8">
      <div className="mx-auto w-full max-w-[1180px] px-4">
        <div className="space-y-0">
          <SectionImage src="/home-clone/hero.png" alt="Hero homepage UNIMALIA" priority>
            <Hotspot
              href="/identita/nuovo"
              label="Crea l'identità digitale del tuo animale"
              left="8.2%"
              top="70.2%"
              width="27.2%"
              height="12.5%"
            />
            <Hotspot
              href="/identita"
              label="Scopri come funziona"
              left="39.5%"
              top="70.2%"
              width="17.4%"
              height="12.5%"
            />
          </SectionImage>

          <SectionImage src="/home-clone/benefits.png" alt="Vantaggi principali homepage UNIMALIA" />

          <SectionImage src="/home-clone/identity.png" alt="Identità digitale dell'animale">
            <Hotspot
              href="/identita/nuovo"
              label="Crea l'identità digitale"
              left="37.2%"
              top="74.2%"
              width="25.2%"
              height="14.8%"
            />
          </SectionImage>

          <SectionImage src="/home-clone/clinic.png" alt="Cartella clinica digitale continua">
            <Hotspot
              href="/professionisti/dashboard"
              label="Come funziona la cartella clinica"
              left="35.6%"
              top="76.0%"
              width="27.8%"
              height="14.0%"
            />
          </SectionImage>

          <SectionImage src="/home-clone/cards.png" alt="Smarrimenti e Adozioni">
            <Hotspot
              href="/smarrimenti/nuovo"
              label="Segnala uno smarrimento"
              left="8.3%"
              top="67.0%"
              width="28.4%"
              height="15.5%"
            />
            <Hotspot
              href="/adotta"
              label="Vai alle adozioni"
              left="54.6%"
              top="67.0%"
              width="20.0%"
              height="15.5%"
            />
          </SectionImage>

          <SectionImage src="/home-clone/audience.png" alt="Area Veterinari e Professionisti Pet">
            <Hotspot
              href="/professionisti/login"
              label="Accedi a Unimalia Professionisti - veterinari"
              left="7.8%"
              top="74.6%"
              width="36.0%"
              height="14.5%"
            />
            <Hotspot
              href="/professionisti/login"
              label="Accedi a Unimalia Professionisti - professionisti pet"
              left="53.6%"
              top="74.6%"
              width="35.0%"
              height="14.5%"
            />
          </SectionImage>

          <SectionImage src="/home-clone/cta.png" alt="Call to action finale UNIMALIA">
            <Hotspot
              href="/identita/nuovo"
              label="Inizia ora"
              left="37.0%"
              top="69.0%"
              width="23.5%"
              height="15.2%"
            />
          </SectionImage>
        </div>
      </div>
    </div>
  );
}
