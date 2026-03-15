import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
  try {
    const { id } = await params;

    if (!id || id === "undefined" || !isUuid(id)) {
      notFound();
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("AnimalEmergencyPage auth error:", userError);
      return (
        <main className="mx-auto max-w-3xl px-4 py-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            Errore autenticazione: {userError.message}
          </div>
        </main>
      );
    }

    if (!user) {
      notFound();
    }

    const { data: animal, error: animalError } = await supabase
      .from("animals")
      .select("id, owner_id, name")
      .eq("id", id)
      .maybeSingle();

    if (animalError) {
      console.error("AnimalEmergencyPage animal query error:", animalError);
      return (
        <main className="mx-auto max-w-3xl px-4 py-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            Errore caricamento animale: {animalError.message}
          </div>
        </main>
      );
    }

    if (!animal) {
      notFound();
    }

    if (!animal.owner_id || animal.owner_id !== user.id) {
      notFound();
    }

    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            UNIMALIA
          </div>
          <h1 className="mt-2 text-2xl font-bold text-neutral-950">
            Emergency QR · {animal.name ?? "Animale"}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Configura la scheda emergenza pubblica e genera il QR dell’animale.
          </p>
        </div>

        <div className="mt-4">
          <EmergencyQrPanel
            animalId={animal.id}
            animalName={animal.name ?? "Animale"}
          />
        </div>
      </main>
    );
  } catch (error) {
    console.error("AnimalEmergencyPage fatal error:", error);

    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          Errore server nella pagina emergenza. Controlla i log Vercel.
        </div>
      </main>
    );
  }
}
