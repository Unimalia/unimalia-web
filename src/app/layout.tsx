import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import AppShell from "../_components/AppShell";

const GA_MEASUREMENT_ID = "G-YE91HM8ZLW";

export const metadata: Metadata = {
  metadataBase: new URL("https://unimalia.it"),
  title: "UNIMALIA",
  description: "Un ecosistema digitale per proteggere la vita dell’animale.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "UNIMALIA",
    description: "Un ecosistema digitale per proteggere la vita dell’animale.",
    url: "https://unimalia.it/",
    siteName: "UNIMALIA",
    images: ["/logo-512.png"],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA",
    description: "Un ecosistema digitale per proteggere la vita dell’animale.",
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
    url: "https://unimalia.it/",
    logo: "https://unimalia.it/logo-512.png",
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