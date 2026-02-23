import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../_components/AppShell";

export const metadata: Metadata = {
  title: "UNIMALIA",
  description: "Un ecosistema digitale per proteggere la vita dell’animale.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}