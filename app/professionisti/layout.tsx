// app/professionisti/layout.tsx
import type { ReactNode } from "react";

export default function ProfessionistiLayout({ children }: { children: ReactNode }) {
  // Qui NON mettiamo header/menu: lo gestisce AppShell (globale)
  return <>{children}</>;
}
