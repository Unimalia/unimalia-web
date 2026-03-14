import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  supabaseAdmin,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    animalId: string;
  }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

async function requireOwnedAnimal(animalId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) {
    return { error: authErr.message, status: 401 as const };
  }

  if (!user) {
    return { error: "Not authenticated", status: 401 as const };
  }

  const { data: animal, error: animalErr } = await supabase
    .from("animals")
    .select("id, owner_id, name")
    .eq("id", animalId)
    .maybeSingle();

  if (animalErr) {
    return { error: animalErr.message, status: 500 as const };
  }

  if (!animal) {
    return { error: "Animal not found", status: 404 as const };
  }

  if (!animal.owner_id || animal.owner_id !== user.id) {
    return { error: "Forbidden", status: 403 as const };
  }

  return { animal, user, status: 200 as const };
}

export async function GET(_req: Request, context: RouteContext) {
  const { animalId } = await context.params;

  if (!animalId || animalId === "undefined") {
    return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
  }

  if (!isUuid(animalId)) {
    return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
  }

  const access = await requireOwnedAnimal(animalId);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      {
        status: access.status,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const admin = supabaseAdmin();

  const query = admin
    .from("animal_emergency_profiles" as never)
    .select(`
      animal_id,
      enabled,
      animal_name,
      species,
      breed,
      sex,
      weight_kg,
      blood_type,
      allergies,
      active_therapies,
      chronic_conditions,
      essential_vaccination_status,
      is_lost,
      emergency_contact_name,
      emergency_contact_phone,
      show_emergency_contact,
      premium_enabled,
      advanced_summary,
      last_visit_summary,
      last_vaccination_summary,
      updated_at
    `)
    .eq("animal_id", animalId)
    .maybeSingle();

  const { data, error } = (await query) as unknown as {
    data: Record<string, unknown> | null;
    error: Error | null;
  };

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  return NextResponse.json(
    {
      profile: data,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function PUT(req: Request, context: RouteContext) {
  const { animalId } = await context.params;

  if (!animalId || animalId === "undefined") {
    return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
  }

  if (!isUuid(animalId)) {
    return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
  }

  const access = await requireOwnedAnimal(animalId);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      {
        status: access.status,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  const payload = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};

  const upsertPayload = {
    animal_id: animalId,
    enabled: toBoolean(payload.enabled, true),

    animal_name: toNullableString(payload.animal_name) ?? access.animal.name ?? null,
    species: toNullableString(payload.species),
    breed: toNullableString(payload.breed),
    sex: toNullableString(payload.sex),
    weight_kg: toNullableNumber(payload.weight_kg),
    blood_type: toNullableString(payload.blood_type),

    allergies: toNullableString(payload.allergies),
    active_therapies: toNullableString(payload.active_therapies),
    chronic_conditions: toNullableString(payload.chronic_conditions),
    essential_vaccination_status: toNullableString(payload.essential_vaccination_status),

    is_lost: toBoolean(payload.is_lost, false),
    emergency_contact_name: toNullableString(payload.emergency_contact_name),
    emergency_contact_phone: toNullableString(payload.emergency_contact_phone),
    show_emergency_contact: toBoolean(payload.show_emergency_contact, false),

    premium_enabled: toBoolean(payload.premium_enabled, false),
    advanced_summary: toNullableString(payload.advanced_summary),
    last_visit_summary: toNullableString(payload.last_visit_summary),
    last_vaccination_summary: toNullableString(payload.last_vaccination_summary),

    updated_at: new Date().toISOString(),
  };

  const admin = supabaseAdmin();

  const query = admin
    .from("animal_emergency_profiles" as never)
    .upsert(upsertPayload as never, {
      onConflict: "animal_id",
    })
    .select(`
      animal_id,
      enabled,
      animal_name,
      species,
      breed,
      sex,
      weight_kg,
      blood_type,
      allergies,
      active_therapies,
      chronic_conditions,
      essential_vaccination_status,
      is_lost,
      emergency_contact_name,
      emergency_contact_phone,
      show_emergency_contact,
      premium_enabled,
      advanced_summary,
      last_visit_summary,
      last_vaccination_summary,
      updated_at
    `)
    .maybeSingle();

  const { data, error } = (await query) as unknown as {
    data: Record<string, unknown> | null;
    error: Error | null;
  };

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      profile: data,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}