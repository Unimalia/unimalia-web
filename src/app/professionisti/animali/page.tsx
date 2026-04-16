import Link from "next/link";
import { getManagedAnimals } from "@/lib/professionisti/getManagedAnimals";
import ManagedAnimalsClient from "./ManagedAnimalsClient.client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfessionistiAnimaliPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = (resolvedSearchParams?.q || "").trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border p-4 text-sm text-red-700">
          Sessione non valida. Effettua di nuovo il login come professionista.
        </div>
      </div>
    );
  }

  let rows: Awaited<ReturnType<typeof getManagedAnimals>> = [];

  try {
    rows = await getManagedAnimals(user.id);
  } catch (e) {
    console.error("[professionisti/animali] getManagedAnimals failed", e);
    rows = [];
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Animali gestiti</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Qui vedi sia gli animali con grant attivo sia quelli creati o originati dalla tua
            clinica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/professionisti/scansiona/manuale/nuovo"
            className="rounded-xl border px-4 py-2"
          >
            Nuovo animale
          </Link>

          <Link
            href="/professionisti/scansiona/manuale"
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            Scansiona microchip
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <ManagedAnimalsClient initialRows={rows} initialQuery={q} />
      </div>
    </div>
  );
}