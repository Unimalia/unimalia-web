import type { Metadata } from "next";
import ProShell from "./_components/ProShell";

export const metadata: Metadata = {
  title: "UNIMALIA — Professionisti",
  description: "Portale professionisti UNIMALIA",
};

export default function ProfessionistiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Nasconde il HEADER pubblico solo quando esiste il portale nel DOM */}
      <style>{`
        body:has([data-pro-portal="true"]) > header { display: none !important; }
      `}</style>

      <ProShell>{children}</ProShell>
    </>
  );
}