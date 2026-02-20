// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UNIMALIA",
  description: "Ecosistema digitale serio ma umano per la vita dell’animale.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}