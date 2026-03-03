import OwnerAccessiProfessionisti from "./_components/OwnerAccessiProfessionisti";

export default function OwnerAnimalPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Scheda animale</h1>
      <OwnerAccessiProfessionisti animalId={params.id} />
    </div>
  );
}