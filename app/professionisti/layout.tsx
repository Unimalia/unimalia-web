import "./globals.css";
import AppShell from "./_components/AppShell";

export const metadata = {
  title: "UNIMALIA",
  description: "UNIMALIA è un ecosistema che rende più semplice gestire la vita dell’animale.",
  openGraph: {
    title: "UNIMALIA",
    description:
      "UNIMALIA è un ecosistema che rende più semplice gestire la vita dell’animale.",
    url: "https://unimalia.it",
    siteName: "UNIMALIA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNIMALIA",
    description:
      "UNIMALIA è un ecosistema che rende più semplice gestire la vita dell’animale.",
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
