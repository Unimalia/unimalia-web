// src/app/professionisti/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProShell from "./_components/ProShell";

export const metadata: Metadata = {
  title: "UNIMALIA — Professionisti",
  description: "Area operativa per professionisti autorizzati: scansione microchip, verifica e gestione richieste.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProfessionistiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Nasconde l’header pubblico solo se il portale professionisti è montato */}
      <style>{`
        body:has([data-pro-portal="true"]) > header { display: none !important; }
      `}</style>

      <ProShell>{children}</ProShell>
    </>
  );
}