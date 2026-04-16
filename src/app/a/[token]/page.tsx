"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { EmergencyPublicPayload } from "@/lib/emergency/public";
import {
  detectEmergencyLocale,
  emergencyDict,
} from "@/lib/emergency/i18n";

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
  const [browserLanguage, setBrowserLanguage] = useState<string>("it");

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setBrowserLanguage(navigator.language || "it");
    }
  }, []);

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

  const locale = useMemo(() => {
    const premiumEnabled = state?.view === "advanced";
    return detectEmergencyLocale(browserLanguage, premiumEnabled);
  }, [browserLanguage, state?.view]);

  const t = emergencyDict[locale];

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-sm text-zinc-700">{t.loading}</p>
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
          {t.home}
        </button>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">{error ?? t.unavailable}</p>
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
            {t.accessDetectedTitle}
          </h1>
          <p className="mt-3 text-sm text-zinc-700">{t.accessDetectedText}</p>
          <p className="mt-2 text-sm text-zinc-700">{t.accessDetectedText2}</p>

          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t.animalLabel}
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
          {t.emergencyTitle}
        </div>
        <div className="mt-1 text-sm text-red-900">{t.emergencySubtitle}</div>
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
            {state.view === "advanced" ? t.premiumAdvanced : t.freeBasic}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoRow label={t.animalName} value={emergency?.animal_name || animal.name} />
          <InfoRow label={t.species} value={emergency?.species || animal.species} />
          <InfoRow label={t.weightKg} value={emergency?.weight_kg ?? null} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3">
        <InfoRow label={t.allergies} value={emergency?.allergies ?? null} />
        <InfoRow label={t.activeTherapies} value={emergency?.active_therapies ?? null} />
        <InfoRow
          label={t.chronicConditions}
          value={emergency?.chronic_conditions ?? null}
        />
      </section>

      {emergency?.is_lost && emergency?.show_emergency_contact && (
        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-700">
            {t.emergencyContact}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow label={t.contactName} value={emergency.emergency_contact_name} />
            <InfoRow label={t.phone} value={emergency.emergency_contact_phone} />
          </div>
        </section>
      )}

      {state.view === "advanced" && emergency && (
        <section className="mt-4 grid grid-cols-1 gap-3">
          <InfoRow
            label={t.vaccinationStatus}
            value={emergency.essential_vaccination_status}
          />
          <InfoRow label={t.advancedSummary} value={emergency.advanced_summary} />
          <InfoRow label={t.lastVisit} value={emergency.last_visit_summary} />
          <InfoRow
            label={t.lastVaccination}
            value={emergency.last_vaccination_summary}
          />
        </section>
      )}

      <footer className="mt-6 text-center text-xs text-zinc-500">
        {t.footer}
      </footer>
    </main>
  );
}
