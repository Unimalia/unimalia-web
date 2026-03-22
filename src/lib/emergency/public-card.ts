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

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  const ms = new Date(expiresAt).getTime();
  if (Number.isNaN(ms)) return false;
  return ms <= Date.now();
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
      .select("id, name, species, breed, color, size, photo_url, birth_date, sterilized")
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