// app/profilo/page.tsx
import { PageShell } from "@/_components/ui/page-shell";
import { ProfiloClient } from "./profilo-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Profilo | UNIMALIA",
};

export default function Page() {
  return (
    <PageShell title="Profilo" subtitle="Dati base dell’account." boxed>
      <ProfiloClient />
    </PageShell>
  );
}