export const dynamic = "force-dynamic";

import ProShell from "./_components/ProShell";

export default function ProfessionistiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProShell>{children}</ProShell>;
}