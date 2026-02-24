// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AppShell from "../_components/AppShell";

const IUBENDA_SITE_ID = process.env.IUBENDA_SITE_ID ?? "";
const IUBENDA_COOKIE_POLICY_ID = process.env.IUBENDA_COOKIE_POLICY_ID ?? "";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.unimalia.it"),
  title: "UNIMALIA",
  description: "Un ecosistema digitale per proteggere la vita dell’animale.",
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "UNIMALIA",
    description: "Un ecosistema digitale per proteggere la vita dell’animale.",
    url: "https://www.unimalia.it/",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "UNIMALIA",
    url: "https://www.unimalia.it/",
    logo: "https://www.unimalia.it/logo-512.png",
  };

  return (
    <html lang="it">
      <body>
        {/* JSON-LD (logo per Google) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />

        {/* Iubenda Cookie Solution (banner + preferenze + consenso) */}
        <Script id="iubenda-cs-config" strategy="beforeInteractive">
          {`
            var _iub = _iub || [];
            _iub.csConfiguration = {
              siteId: ${JSON.stringify(IUBENDA_SITE_ID)},
              cookiePolicyId: ${JSON.stringify(IUBENDA_COOKIE_POLICY_ID)},
              lang: "it",

              priorConsent: true,
              perPurposeConsent: true,
              rejectButton: true,

              floatingPreferencesButtonDisplay: "bottom-right",
              enableRemoteConsent: true
            };
          `}
        </Script>

        <Script
          id="iubenda-cs"
          strategy="beforeInteractive"
          src="https://cdn.iubenda.com/cs/iubenda_cs.js"
        />

        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}