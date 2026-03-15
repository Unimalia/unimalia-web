"use client";

import { useEffect, useState } from "react";

type Props = {
  animalId: string;
  animalName: string;
};

type EmergencyProfile = {
  enabled: boolean;
  animal_name: string | null;
  species: string | null;
  weight_kg: number | null;
  allergies: string | null;
  active_therapies: string | null;
  chronic_conditions: string | null;
  is_lost: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  show_emergency_contact: boolean;
  premium_enabled: boolean;
  essential_vaccination_status: string | null;
  advanced_summary: string | null;
  last_visit_summary: string | null;
  last_vaccination_summary: string | null;
};

export default function EmergencyQrPanel({ animalId }: Props) {
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const res = await fetch(`/api/animals/${animalId}/emergency-profile`);

        const json = await res.json();

        if (res.ok) {
          setProfile(json);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [animalId]);

  async function save() {
    if (!profile) return;

    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch(`/api/animals/${animalId}/emergency-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        throw new Error();
      }

      setStatus("Profilo emergenza salvato.");
    } catch {
      setStatus("Errore nel salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">Caricamento profilo emergenza…</p>;
  }

  if (!profile) {
    return <p className="text-sm text-red-600">Profilo emergenza non disponibile.</p>;
  }

  return (
    <div className="space-y-6">

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Emergency View</h2>

        <p className="mt-1 text-sm text-zinc-600">
          Questa scheda viene mostrata quando qualcuno scansiona il QR
          dell’animale senza essere autenticato su UNIMALIA.
        </p>

        <label className="mt-4 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={profile.enabled}
            onChange={(e) =>
              setProfile({ ...profile, enabled: e.target.checked })
            }
          />
          Attiva scheda emergenza
        </label>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <h3 className="font-semibold">Informazioni essenziali</h3>

        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Peso kg"
          value={profile.weight_kg ?? ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              weight_kg: Number(e.target.value) || null,
            })
          }
        />

        <textarea
          className="w-full rounded border px-3 py-2"
          placeholder="Allergie"
          value={profile.allergies ?? ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              allergies: e.target.value || null,
            })
          }
        />

        <textarea
          className="w-full rounded border px-3 py-2"
          placeholder="Terapie attive"
          value={profile.active_therapies ?? ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              active_therapies: e.target.value || null,
            })
          }
        />

        <textarea
          className="w-full rounded border px-3 py-2"
          placeholder="Patologie croniche"
          value={profile.chronic_conditions ?? ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              chronic_conditions: e.target.value || null,
            })
          }
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <h3 className="font-semibold">Contatto emergenza</h3>

        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Nome contatto"
          value={profile.emergency_contact_name ?? ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              emergency_contact_name: e.target.value || null,
            })
          }
        />

        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Telefono"
          value={profile.emergency_contact_phone ?? ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              emergency_contact_phone: e.target.value || null,
            })
          }
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Salva
      </button>

      {status && (
        <p className="text-sm text-zinc-600">{status}</p>
      )}
    </div>
  );
}
