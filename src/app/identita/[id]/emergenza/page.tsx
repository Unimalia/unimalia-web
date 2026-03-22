"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { PageShell } from "@/_components/ui/page-shell";
import { ButtonPrimary, ButtonSecondary } from "@/_components/ui/button";

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photo_url?: string | null;
  birth_date?: string | null;
  sterilized?: boolean | null;
};

type ClinicEvent = {
  type?: string | null;
  description?: string | null;
  meta?: any;
};

export default function AnimalEmergencyPage() {
  const params = useParams<{ id: string }>();
  const animalId = params?.id ?? "";

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<ClinicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔘 selezione campi emergenza
  const [fields, setFields] = useState({
    photo: true,
    name: true,
    species: true,
    allergies: true,
    therapies: true,
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!animalId) return;

      setLoading(true);

      const { data: animalData } = await supabase
        .from("animals")
        .select("*")
        .eq("id", animalId)
        .single();

      const res = await fetch(`/api/clinic-events/list?animalId=${animalId}`);
      const json = await res.json().catch(() => ({}));

      if (!alive) return;

      setAnimal(animalData || null);
      setEvents(json?.events || []);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [animalId]);

  // 🧠 estrazione dati emergenza
  const emergencyData = useMemo(() => {
    const allergies = events
      .filter((e) => e.type === "allergy")
      .map((e) => e.description)
      .filter(Boolean)
      .slice(0, 3);

    const therapies = events
      .filter((e) => e.type === "therapy")
      .map((e) => e.description)
      .filter(Boolean)
      .slice(0, 3);

    return {
      allergies,
      therapies,
    };
  }, [events]);

  function toggleField(key: keyof typeof fields) {
    setFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  if (loading) {
    return (
      <PageShell title="Emergenza" backFallbackHref={`/identita/${animalId}`}>
        <div className="text-sm text-zinc-600">Caricamento…</div>
      </PageShell>
    );
  }

  if (!animal) {
    return (
      <PageShell title="Emergenza" backFallbackHref="/identita">
        <div className="text-red-600">Animale non trovato</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="QR emergenza / medaglietta"
      subtitle="Configura cosa sarà visibile quando qualcuno scansiona il QR."
      backFallbackHref={`/identita/${animalId}`}
      actions={
        <>
          <ButtonSecondary href={`/identita/${animalId}`}>
            Torna alla scheda
          </ButtonSecondary>
          <ButtonPrimary>Salva configurazione</ButtonPrimary>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* ⚙️ CONFIGURAZIONE */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">
            Dati visibili
          </h2>

          <div className="mt-4 flex flex-col gap-3 text-sm">
            {Object.entries(fields).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => toggleField(key as any)}
                />
                <span className="capitalize">{key}</span>
              </label>
            ))}
          </div>
        </section>

        {/* 👁️ PREVIEW */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">
            Anteprima emergenza
          </h2>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
            {fields.photo && animal.photo_url && (
              <img
                src={animal.photo_url}
                className="h-40 w-full object-contain rounded-xl bg-white"
              />
            )}

            {fields.name && (
              <div className="font-semibold text-lg">{animal.name}</div>
            )}

            {fields.species && (
              <div className="text-sm text-zinc-600">
                {animal.species} {animal.breed || ""}
              </div>
            )}

            {fields.allergies && emergencyData.allergies.length > 0 && (
              <div className="text-sm">
                ⚠️ Allergie: {emergencyData.allergies.join(", ")}
              </div>
            )}

            {fields.therapies && emergencyData.therapies.length > 0 && (
              <div className="text-sm">
                💊 Terapie: {emergencyData.therapies.join(", ")}
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Questa è la schermata che vedrà chi scansiona il QR.
          </p>
        </section>
      </div>
    </PageShell>
  );
}