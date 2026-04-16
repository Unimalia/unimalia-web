import Link from "next/link";
import OwnerAccessiProfessionisti from "./_components/OwnerAccessiProfessionisti";

export const dynamic = "force-dynamic";

export default async function OwnerAnimalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Scheda animale</h1>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/identita"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Vai alle identità
          </Link>
        </div>
      </div>

      <OwnerAccessiProfessionisti animalId={id} />
    </div>
  );
}