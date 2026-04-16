import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import AppShell from "../_components/AppShell";

const GA_MEASUREMENT_ID = "G-YE91HM8ZLW";
const SITE_URL = "https://unimalia.it";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "UNIMALIA",
    template: "%s | UNIMALIA",
  },

  description:
    "UNIMALIA è la piattaforma per identità digitale animale, smarrimenti, accessi clinici controllati, consulti veterinari e ricerca di professionisti del settore animale.",

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },

  manifest: "/site.webmanifest",

  openGraph: {
    title: "UNIMALIA",
    description:
      "Piattaforma per identità digitale animale, smarrimenti, accessi clinici controllati, consulti veterinari e servizi per proprietari e professionisti.",
    url: SITE_URL,
    siteName: "UNIMALIA",
    images: [
      {
        url: `${SITE_URL}/logo-512.png`,
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
      "Piattaforma per identità digitale animale, smarrimenti, accessi clinici controllati, consulti veterinari e servizi per proprietari e professionisti.",
    images: [`${SITE_URL}/logo-512.png`],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "UNIMALIA",
        url: SITE_URL,
        logo: `${SITE_URL}/logo-512.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "UNIMALIA",
        inLanguage: "it-IT",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
    ],
  };

  return (
    <html lang="it">
      <body>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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