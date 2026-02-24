import type { Metadata } from "next";
import ProShell from "./_components/ProShell";

export const metadata: Metadata = {
  title: "UNIMALIA — Professionisti",
  description: "Portale professionisti UNIMALIA",
};

export default function ProfessionistiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProShell>{children}</ProShell>;
}