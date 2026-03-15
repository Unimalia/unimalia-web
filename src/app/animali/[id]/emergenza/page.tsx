import { notFound } from "next/navigation";
import EmergencyQrPanel from "@/_components/animal/EmergencyQrPanel";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export default async function AnimalEmergencyPage({ params }: PageProps) {
  const { id } = await params;

  if (!id || id === "undefined" || !isUuid(id)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          UNIMALIA
        </div>
        <h1 className="mt-2 text-2xl font-bold text-neutral-950">
          Emergency QR
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Configura la scheda emergenza pubblica e genera il QR dell’animale.
        </p>
      </div>

      <div className="mt-4">
        <EmergencyQrPanel animalId={id} animalName="Animale" />
      </div>
    </main>
  );
}
