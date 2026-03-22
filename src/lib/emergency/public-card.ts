import "server-only";

import { buildClinicalQuickSummary } from "@/lib/clinic/quickSummary";
import {
  insertEmergencyAccessLog,
  resolveEmergencyToken,
  touchEmergencyToken,
} from "@/lib/emergency/repository";
import { isEmergencyTokenFormatValid } from "@/lib/emergency/token";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type PublicEmergencyCardPayload = {
  animal: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    color: string | null;
    size: string | null;
    photoUrl: string | null;
  };
  owner: {
    fullName: string | null;
    phone: string | null;
  };
  settings: {
    showPhoto: boolean;
    showName: boolean;
    showSpecies: boolean;
    showBreed: boolean;
    showColor: boolean;
    showSize: boolean;
    showOwnerName: boolean;
    showOwnerPhone: boolean;
    showAllergies: boolean;
    showTherapies: boolean;
    showChronicConditions: boolean;
    showBloodType: boolean;
    showSterilizationStatus: boolean;
    emergencyNotes: string | null;
  };
  clinical: {
    allergies: string[];
    activeTherapies: string[];
    chronicPathologies: string[];
    bloodType: string;
    sterilizationStatus: string;
  };
};

type EmergencyRequestMeta = {
  requestPath?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  country?: string | null;
  requestId?: string | null;
};

type AnimalRow = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  size: string | null;
  photo_url: string | null;
  birth_date: string | null;
  sterilized: boolean | null;
  owner_id: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

type SettingsRow = {
  animal_id: string;
  show_photo: boolean;
  show_name: boolean;
  show_species: boolean;
  show_breed: boolean;
  show_color: boolean;
  show_size: boolean;
  show_owner_name: boolean;
  show_owner_phone: boolean;
  show_allergies: boolean;
  show_therapies: boolean;
  show_chronic_conditions: boolean;
  show_blood_type: boolean;
  show_sterilization_status: boolean;
  emergency_notes: string | null;
};

type ClinicEventRow = {
  id: string;
  event_date: string | null;
  type: string | null;
  title: string | null;
  description: string | null;
  visibility: string | null;
  status: string | null;
  created_at: string | null;
  meta: Record<string, unknown> | null;
};

const DEFAULT_SETTINGS: PublicEmergencyCardPayload["settings"] = {
  showPhoto: true,
  showName: true,
  showSpecies: true,
  showBreed: true,
  showColor: true,
  showSize: true,
  showOwnerName: false,
  showOwnerPhone: false,
  showAllergies: true,
  showTherapies: true,
  showChronicConditions: true,
  showBloodType: true,
  showSterilizationStatus: true,
  emergencyNotes: null,
};

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  const ms = new Date(expiresAt).getTime();
  if (Number.isNaN(ms)) return false;
  return ms <= Date.now();
}

function buildOwnerName(profile: ProfileRow | null) {
  if (!profile) return null;
  if (profile.full_name?.trim()) return profile.full_name.trim();

  const joined = [profile.first_name, profile.last_name]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return joined || null;
}

export async function getPublicEmergencyCardByToken(
  rawToken: string,
  meta?: EmergencyRequestMeta
): Promise<PublicEmergencyCardPayload | null> {
  try {
    const token = String(rawToken ?? "").trim();

    if (!isEmergencyTokenFormatValid(token)) {
      return null;
    }

    const resolved = await resolveEmergencyToken(token);

    if (!resolved.row) {
      return null;
    }

    if (resolved.row.status !== "active" || isExpired(resolved.row.expires_at)) {
      return null;
    }

    const admin = supabaseAdmin();

    const animalQuery = admin
      .from("animals" as never)
      .select("id, name, species, breed, color, size, photo_url, birth_date, sterilized, owner_id")
      .eq("id", resolved.row.animal_id)
      .maybeSingle();

    const { data: animal, error: animalError } = (await animalQuery) as unknown as {
      data: AnimalRow | null;
      error: Error | null;
    };

    if (animalError || !animal) {
      console.error("getPublicEmergencyCardByToken animal error", animalError);
      return null;
    }

    const settingsQuery = admin
      .from("animal_emergency_settings" as never)
      .select("*")
      .eq("animal_id", animal.id)
      .maybeSingle();

    const { data: rawSettings } = (await settingsQuery) as unknown as {
      data: SettingsRow | null;
      error: Error | null;
    };

    const settings: PublicEmergencyCardPayload["settings"] = rawSettings
      ? {
          showPhoto: rawSettings.show_photo,
          showName: rawSettings.show_name,
          showSpecies: rawSettings.show_species,
          showBreed: rawSettings.show_breed,
          showColor: rawSettings.show_color,
          showSize: rawSettings.show_size,
          showOwnerName: rawSettings.show_owner_name,
          showOwnerPhone: rawSettings.show_owner_phone,
          showAllergies: rawSettings.show_allergies,
          showTherapies: rawSettings.show_therapies,
          showChronicConditions: rawSettings.show_chronic_conditions,
          showBloodType: rawSettings.show_blood_type,
          showSterilizationStatus: rawSettings.show_sterilization_status,
          emergencyNotes: rawSettings.emergency_notes ?? null,
        }
      : DEFAULT_SETTINGS;

    let ownerProfile: ProfileRow | null = null;

    if (animal.owner_id) {
      const profileQuery = admin
        .from("profiles" as never)
        .select("id, full_name, first_name, last_name, phone")
        .eq("id", animal.owner_id)
        .maybeSingle();

      const { data: profileData } = (await profileQuery) as unknown as {
        data: ProfileRow | null;
        error: Error | null;
      };

      ownerProfile = profileData ?? null;
    }

    const eventsQuery = admin
      .from("animal_clinic_events" as never)
      .select("id, event_date, type, title, description, visibility, status, created_at, meta")
      .eq("animal_id", animal.id)
      .neq("status", "void")
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false });

    const { data: events, error: eventsError } = (await eventsQuery) as unknown as {
      data: ClinicEventRow[] | null;
      error: Error | null;
    };

    if (eventsError) {
      console.error("getPublicEmergencyCardByToken events error", eventsError);
      return null;
    }

    const quick = buildClinicalQuickSummary({
      animal: {
        birth_date: animal.birth_date ?? null,
        sterilized: animal.sterilized ?? null,
      },
      events: events ?? [],
    });

    try {
      await touchEmergencyToken(resolved.tokenHash);
    } catch (error) {
      console.error("touchEmergencyToken crashed", error);
    }

    try {
      await insertEmergencyAccessLog({
        tokenHash: resolved.tokenHash,
        animalId: animal.id,
        requestPath: meta?.requestPath ?? `/emergency/${token}`,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
        country: meta?.country ?? null,
        outcome: "success",
        servedView: "public_emergency_v2",
        requestId: meta?.requestId ?? null,
      });
    } catch (error) {
      console.error("insertEmergencyAccessLog crashed", error);
    }

    return {
      animal: {
        id: animal.id,
        name: animal.name,
        species: animal.species,
        breed: animal.breed,
        color: animal.color,
        size: animal.size,
        photoUrl: animal.photo_url ?? null,
      },
      owner: {
        fullName: buildOwnerName(ownerProfile),
        phone: ownerProfile?.phone?.trim() || null,
      },
      settings,
      clinical: {
        allergies: quick.allergies.slice(0, 3),
        activeTherapies: quick.activeTherapies.slice(0, 3),
        chronicPathologies: quick.chronicPathologies.slice(0, 3),
        bloodType: quick.bloodType,
        sterilizationStatus: quick.sterilizationStatus,
      },
    };
  } catch (error) {
    console.error("getPublicEmergencyCardByToken crashed", error);
    return null;
  }
}