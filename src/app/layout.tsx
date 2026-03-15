// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AppShell from "../_components/AppShell";

const GA_MEASUREMENT_ID = "G-YE91HM8ZLW";

export const metadata: Metadata = {
  metadataBase: new URL("https://unimalia.it"),
  title: "UNIMALIA",
  description: "Un ecosistema digitale per proteggere la vita dell’animale.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        {/* JSON-LD (logo per Google) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />

        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

        {/* Iubenda disattivato temporaneamente finché non viene configurato davvero */}

        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}