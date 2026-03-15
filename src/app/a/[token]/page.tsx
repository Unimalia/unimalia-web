"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { EmergencyPublicPayload } from "@/lib/emergency/public";

type AnimalPublic = {
  animal_id: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
};

type PageState = {
  animal: AnimalPublic;
  emergency: EmergencyPublicPayload["emergency"];
  view: "basic" | "advanced";
};

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-900">{value}</div>
    </div>
  );
}

export default function AnimalPublicPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<PageState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [{ data: authData }, emergencyRes] = await Promise.all([
          supabase.auth.getUser(),
          fetch(`/api/public/animal-emergency/${token}`, {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const isLoggedIn = !!authData?.user;

        if (!alive) return;

        setHasSession(isLoggedIn);

        const text = await emergencyRes.text();
        const json = text
          ? (JSON.parse(text) as EmergencyPublicPayload | { error: string })
          : null;

        if (!emergencyRes.ok) {
          throw new Error(
            json && "error" in json ? json.error : "Scheda non disponibile."
          );
        }

        if (!json || "error" in json) {
          throw new Error(json?.error || "Scheda non disponibile.");
        }

        setState({
          animal: {
            animal_id: json.animal.animalId,
            name: json.animal.name,
            species: json.animal.species,
            breed: json.animal.breed,
            color: json.animal.color,
          },
          emergency: json.emergency,
          view: json.view,
        });
      } catch {
        if (!alive) return;
        setState(null);
        setError("Errore nel caricamento della scheda.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (token) {
      void load();
    }

    return () => {
      alive = false;
    };
  }, [token]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-sm text-zinc-700">Caricamento…</p>
      </main>
    );
  }

  if (!state || error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          ← Home
        </button>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">
            {error ?? "Scheda non disponibile."}
          </p>
        </div>
      </main>
    );
  }

  const animal = state.animal;
  const emergency = state.emergency;

  if (hasSession) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            UNIMALIA
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
            Accesso rilevato
          </h1>
          <p className="mt-3 text-sm text-zinc-700">
            Hai aperto il QR da una sessione autenticata UNIMALIA.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Nel prossimo step collegheremo qui il flusso completo basato sui
            permessi reali. Per ora la vista emergenza pubblica è riservata
            all’accesso anonimo.
          </p>

          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Animale
            </div>
            <div className="mt-1 text-sm text-zinc-900">
              {animal.name} · {animal.species}
              {animal.breed ? ` · ${animal.breed}` : ""}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="text-sm font-semibold text-red-700">
          Emergency Veterinary View
        </div>
        <div className="mt-1 text-sm text-red-900">
          Vista emergenziale di accesso rapido per veterinari, soccorritori e
          persone che trovano l’animale.
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
              {emergency?.animal_name || animal.name}
            </h1>
            <p className="mt-2 text-zinc-700">
              {emergency?.species || animal.species}
              {animal.breed ? ` • ${animal.breed}` : ""}
            </p>
          </div>

          <div
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              state.view === "advanced"
                ? "bg-blue-100 text-blue-700"
                : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {state.view === "advanced" ? "Premium · Advanced" : "Free · Basic"}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoRow label="Nome animale" value={emergency?.animal_name || animal.name} />
          <InfoRow label="Specie" value={emergency?.species || animal.species} />
          <InfoRow label="Peso (kg)" value={emergency?.weight_kg ?? null} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3">
        <InfoRow label="Allergie" value={emergency?.allergies ?? null} />
        <InfoRow label="Terapie attive" value={emergency?.active_therapies ?? null} />
        <InfoRow
          label="Patologie croniche essenziali"
          value={emergency?.chronic_conditions ?? null}
        />
      </section>

      {emergency?.is_lost && emergency?.show_emergency_contact && (
        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-700">
            Contatto emergenza
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow label="Nome" value={emergency.emergency_contact_name} />
            <InfoRow label="Telefono" value={emergency.emergency_contact_phone} />
          </div>
        </section>
      )}

      {state.view === "advanced" && emergency && (
        <section className="mt-4 grid grid-cols-1 gap-3">
          <InfoRow
            label="Stato vaccinale sintetico"
            value={emergency.essential_vaccination_status}
          />
          <InfoRow label="Riepilogo sanitario breve" value={emergency.advanced_summary} />
          <InfoRow label="Ultima visita" value={emergency.last_visit_summary} />
          <InfoRow
            label="Ultima vaccinazione"
            value={emergency.last_vaccination_summary}
          />
        </section>
      )}

      <footer className="mt-6 text-center text-xs text-zinc-500">
        UNIMALIA · La vista pubblica non sostituisce la cartella clinica completa.
      </footer>
    </main>
  );
}
