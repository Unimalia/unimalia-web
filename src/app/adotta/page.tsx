import { PageShell } from "@/_components/ui/page-shell";
import { AdottaClient } from "./_components/adotta-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Adozioni | UNIMALIA",
  description:
    "Area adozioni UNIMALIA: spazio dedicato alle associazioni per pubblicare animali adottabili in modo ordinato, con identità animale digitale e ricerca tramite filtri.",
};

export default function Page() {
  return (
    <PageShell
      title="Adozioni"
      subtitle="Area dedicata alle associazioni per pubblicare animali adottabili in modo più ordinato e consultabile."
      boxed
    >
      <AdottaClient />
    </PageShell>
  );
}