// app/professionisti/layout.tsx
import type { ReactNode } from "react";
import AppShell from "../_components/AppShell";

export const metadata = {
  title: "UNIMALIA • Professionisti",
  description: "Portale professionisti UNIMALIA",
};

export default function ProfessionistiLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
