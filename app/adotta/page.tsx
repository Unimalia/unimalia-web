// app/adotta/page.tsx
import { PageShell } from "@/_components/ui/page-shell";
import { AdottaClient } from "./_components/adotta-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Adotta | UNIMALIA",
};

export default function Page() {
  return (
    <PageShell title="Adotta" subtitle="Adozioni da canili, gattili e rifugi." boxed>
      <AdottaClient />
    </PageShell>
  );
}