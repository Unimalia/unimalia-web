import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}