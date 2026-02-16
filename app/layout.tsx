// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import AppShell from "./_components/AppShell";

export const metadata = {
  title: "UNIMALIA",
  description: "UNIMALIA è un ecosistema per la vita dell’animale.",
  openGraph: {
    title: "UNIMALIA",
    description: "UNIMALIA è un ecosistema per la vita dell’animale.",
    url: "https://unimalia.it",
    siteName: "UNIMALIA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA",
    description: "UNIMALIA è un ecosistema per la vita dell’animale.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
