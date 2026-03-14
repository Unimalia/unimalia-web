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
  breed: string | null;
  sex: string | null;
  weight_kg: number | null;
  blood_type: string | null;
  allergies: string | null;
  active_therapies: string | null;
  chronic_conditions: string | null;
  essential_vaccination_status: string | null;
  is_lost: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  show_emergency_contact: boolean;
  premium_enabled: boolean;
  advanced_summary: string | null;
  last_visit_summary: string | null;
  last_vaccination_summary: string | null;
};

type QrCreated = {
  status: "created";
  token: string;
  url: string;
};

type QrExists = {
  status: "exists";
  message: string;
};

type QrError = {
  error: string;
};

type QrResponse = QrCreated | QrExists | QrError;

const emptyProfile: EmergencyProfile = {
  enabled: true,
  animal_name: null,
  species: null,
  breed: null,
  sex: null,
  weight_kg: null,
  blood_type: null,
  allergies: null,
  active_therapies: null,
  chronic_conditions: null,
  essential_vaccination_status: null,
  is_lost: false,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  show_emergency_contact: false,
  premium_enabled: false,
  advanced_summary: null,
  last_visit_summary: null,
  last_vaccination_summary: null,
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium">{label}</div>
      {children}
    </label>
  );
}

export default function EmergencyQrPanel({ animalId, animalName }: Props) {
  const [profile, setProfile] = useState<EmergencyProfile>({
    ...emptyProfile,
    animal_name: animalName,
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingQr, setCreatingQr] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [qrStatus, setQrStatus] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);

  async function loadProfile() {
    setLoadingProfile(true);

    try {
      const res = await fetch(`/api/animals/${animalId}/emergency-profile`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setProfile({
        ...emptyProfile,
        animal_name: animalName,
        ...(json.profile ?? {}),
      });
    } catch (err) {
      setErrorMessage("Errore caricamento profilo");
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [animalId]);

  function updateField<K extends keyof EmergencyProfile>(
    key: K,
    value: EmergencyProfile[K]
  ) {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function saveProfile() {
    setSavingProfile(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/animals/${animalId}/emergency-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setMessage("Scheda salvata.");
    } catch {
      setErrorMessage("Errore salvataggio.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function createQr() {
    setCreatingQr(true);
    setErrorMessage(null);
    setMessage(null);
    setQrStatus(null);

    try {
      const res = await fetch(`/api/animals/${animalId}/emergency-qr`, {
        method: "GET",
        cache: "no-store",
      });

      const json = (await res.json()) as QrResponse;

      if (!res.ok) {
        throw new Error("error" in json ? json.error : "Errore generazione QR");
      }

      if ("error" in json) {
        throw new Error(json.error);
      }

      if (json.status === "created") {
        setQrStatus("QR creato");
        setQrUrl(json.url);
        setQrToken(json.token);
        setMessage("QR generato correttamente");
        return;
      }

      if (json.status === "exists") {
        setQrStatus("QR già esistente");
        setMessage(json.message);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Errore creazione QR"
      );
    } finally {
      setCreatingQr(false);
    }
  }

  async function copyUrl() {
    if (!qrUrl) return;
    await navigator.clipboard.writeText(qrUrl);
    setMessage("Link copiato");
  }

  if (loadingProfile) {
    return <div>Caricamento scheda emergenza…</div>;
  }

  return (
    <div className="space-y-6">

      {(message || errorMessage) && (
        <div className="text-sm">
          {errorMessage ?? message}
        </div>
      )}

      <div className="space-y-4">

        <Field label="Nome animale">
          <input
            value={profile.animal_name ?? ""}
            onChange={(e) => updateField("animal_name", e.target.value)}
            className="border p-2 w-full"
          />
        </Field>

        <Field label="Specie">
          <input
            value={profile.species ?? ""}
            onChange={(e) => updateField("species", e.target.value)}
            className="border p-2 w-full"
          />
        </Field>

        <Field label="Razza">
          <input
            value={profile.breed ?? ""}
            onChange={(e) => updateField("breed", e.target.value)}
            className="border p-2 w-full"
          />
        </Field>

        <Field label="Peso kg">
          <input
            type="number"
            value={profile.weight_kg ?? ""}
            onChange={(e) =>
              updateField(
                "weight_kg",
                e.target.value ? Number(e.target.value) : null
              )
            }
            className="border p-2 w-full"
          />
        </Field>

        <Field label="Allergie">
          <textarea
            value={profile.allergies ?? ""}
            onChange={(e) => updateField("allergies", e.target.value)}
            className="border p-2 w-full"
          />
        </Field>

        <Field label="Terapie attive">
          <textarea
            value={profile.active_therapies ?? ""}
            onChange={(e) =>
              updateField("active_therapies", e.target.value)
            }
            className="border p-2 w-full"
          />
        </Field>

        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Salva scheda emergenza
        </button>

      </div>

      <div className="border-t pt-4 space-y-3">

        <button
          onClick={createQr}
          disabled={creatingQr}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Genera QR
        </button>

        <button
          onClick={copyUrl}
          disabled={!qrUrl}
          className="px-4 py-2 border rounded"
        >
          Copia link
        </button>

        <div>
          <strong>Status:</strong> {qrStatus ?? "Nessun QR generato"}
        </div>

        <div>
          <strong>URL:</strong> {qrUrl ?? "-"}
        </div>

        <div>
          <strong>Token:</strong> {qrToken ?? "-"}
        </div>

      </div>

    </div>
  );
}
