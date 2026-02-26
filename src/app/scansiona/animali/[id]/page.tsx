import RemindersSection from "./RemindersSection";

export default async function Page({ params }: { params: { id: string } }) {
  // ... tua UI già esistente

  return (
    <div className="space-y-4">
      {/* ... resto scheda animale ... */}

      <RemindersSection animalId={params.id} />

      {/* ... altre sezioni ... */}
    </div>
  );
}