import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AppShell from "../_components/AppShell";

export const metadata: Metadata = {
  title: "UNIMALIA",
  description: "Un ecosistema digitale per proteggere la vita dell’animale.",
};

const IUBENDA_SITE_ID = process.env.IUBENDA_SITE_ID ?? "";
const IUBENDA_COOKIE_POLICY_ID = process.env.IUBENDA_COOKIE_POLICY_ID ?? "";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        {/* Iubenda Cookie Solution (banner + preferenze + consenso) */}
        <Script id="iubenda-cs-config" strategy="beforeInteractive">
          {`
            var _iub = _iub || [];
            _iub.csConfiguration = {
              siteId: ${JSON.stringify(IUBENDA_SITE_ID)},
              cookiePolicyId: ${JSON.stringify(IUBENDA_COOKIE_POLICY_ID)},
              lang: "it",

              // Consenso preventivo e scelta reale
              priorConsent: true,
              perPurposeConsent: true,
              rejectButton: true,

              // Comodo per riaprire preferenze
              floatingPreferencesButtonDisplay: "bottom-right",

              // Utile per audit
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