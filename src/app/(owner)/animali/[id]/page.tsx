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
      <h1 className="text-xl font-semibold">Scheda animale</h1>
      <OwnerAccessiProfessionisti animalId={id} />
    </div>
  );
}