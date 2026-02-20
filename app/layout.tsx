import "./globals.css";
import type { Metadata } from "next";
import AppShell from "./_components/AppShell";

export const metadata: Metadata = {
  title: "UNIMALIA",
  description:
    "UNIMALIA è un ecosistema che rende più semplice gestire la vita dell’animale: smarrimenti, identità digitale, informazioni utili, e in futuro un collegamento con i professionisti.",
  openGraph: {
    title: "UNIMALIA",
    description:
      "UNIMALIA è un ecosistema che rende più semplice gestire la vita dell’animale: smarrimenti, identità digitale, informazioni utili, e in futuro un collegamento con i professionisti.",
    url: "https://unimalia.it",
    siteName: "UNIMALIA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA",
    description:
      "UNIMALIA è un ecosistema che rende più semplice gestire la vita dell’animale: smarrimenti, identità digitale, informazioni utili, e in futuro un collegamento con i professionisti.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}