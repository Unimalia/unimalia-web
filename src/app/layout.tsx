import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import AppShell from "../_components/AppShell";

const GA_MEASUREMENT_ID = "G-YE91HM8ZLW";
const SITE_URL = "https://www.unimalia.it";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "UNIMALIA",
    template: "%s | UNIMALIA",
  },
  description:
    "UNIMALIA è un ecosistema digitale per proteggere la vita dell’animale: identità digitale, smarrimenti e strumenti per proprietari e professionisti.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "UNIMALIA",
    description:
      "Un ecosistema digitale per proteggere la vita dell’animale: identità digitale, smarrimenti e strumenti per proprietari e professionisti.",
    url: SITE_URL,
    siteName: "UNIMALIA",
    images: [
      {
        url: "/logo-512.png",
        width: 512,
        height: 512,
        alt: "Logo UNIMALIA",
      },
    ],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA",
    description:
      "Un ecosistema digitale per proteggere la vita dell’animale: identità digitale, smarrimenti e strumenti per proprietari e professionisti.",
    images: ["/logo-512.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "UNIMALIA",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-512.png`,
  };

  return (
    <html lang="it">
      <body>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />

        <Script
          nonce={nonce}
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" nonce={nonce} strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}