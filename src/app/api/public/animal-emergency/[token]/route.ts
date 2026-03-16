import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import type { EmergencyPublicPayload } from "@/lib/emergency/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnimalPublicRow = {
  animal_id: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
};

type EmergencyProfileRow = {
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

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizePublicRef(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^unimalia[:\-]/i.test(raw)) {
    return raw.replace(/^unimalia[:\-]/i, "").trim();
  }

  return raw;
}

async function resolveAnimalPublic(ref: string) {
  const supabase = await createClient();
  const admin = supabaseAdmin();

  const normalized = normalizePublicRef(ref);

  if (!normalized) {
    return { animal: null as AnimalPublicRow | null, error: "Token mancante" };
  }

  // 1) prova resolver legacy token -> RPC
  const rpcResult = await supabase.rpc("get_animal_public", {
    p_token: normalized,
  });

  if (!rpcResult.error) {
    const rpcAnimal = (rpcResult.data?.[0] as AnimalPublicRow | undefined) ?? null;
    if (rpcAnimal) {
      return { animal: rpcAnimal, error: null };
    }
  }

  // 2) prova UUID animale diretto
  if (isUuid(normalized)) {
    const byId = await admin
      .from("animals")
      .select("id, name, species, breed, color")
      .eq("id", normalized)
      .maybeSingle();

    if (byId.error) {
      return { animal: null, error: byId.error.message };
    }

    if (byId.data) {
      return {
        animal: {
          animal_id: byId.data.id,
          name: byId.data.name,
          species: byId.data.species,
          breed: byId.data.breed,
          color: byId.data.color,
        },
        error: null,
      };
    }
  }

  // 3) prova unimalia_code
  const byCode = await admin
    .from("animals")
    .select("id, name, species, breed, color")
    .eq("unimalia_code", normalized)
    .maybeSingle();

  if (byCode.error) {
    return { animal: null, error: byCode.error.message };
  }

  if (byCode.data) {
    return {
      animal: {
        animal_id: byCode.data.id,
        name: byCode.data.name,
        species: byCode.data.species,
        breed: byCode.data.breed,
        color: byCode.data.color,
      },
      error: null,
    };
  }

  return { animal: null, error: "Token non valido o non attivo" };
}

export async function GET(_req: Request, context: RouteContext) {
  const { token } = await context.params;
  const safeToken = String(token ?? "").trim();

  if (!safeToken) {
    return NextResponse.json({ error: "Token mancante" }, { status: 400 });
  }

  const resolved = await resolveAnimalPublic(safeToken);

  if (resolved.error && !resolved.animal) {
    return NextResponse.json(
      { error: resolved.error },
      {
        status: 404,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          Pragma: "no-cache",
          "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
        },
      }
    );
  }

  const animal = resolved.animal;

  if (!animal) {
    return NextResponse.json(
      { error: "Token non valido o non attivo" },
      {
        status: 404,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          Pragma: "no-cache",
          "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
        },
      }
    );
  }

  const admin = supabaseAdmin();

  const profileQuery = admin
    .from("animal_emergency_profiles" as never)
    .select(`
      enabled,
      animal_name,
      species,
      weight_kg,
      allergies,
      active_therapies,
      chronic_conditions,
      is_lost,
      emergency_contact_name,
      emergency_contact_phone,
      show_emergency_contact,
      premium_enabled,
      essential_vaccination_status,
      advanced_summary,
      last_visit_summary,
      last_vaccination_summary
    `)
    .eq("animal_id", animal.animal_id)
    .maybeSingle();

  const { data: rawProfile, error: profileError } = (await profileQuery) as unknown as {
    data: EmergencyProfileRow | null;
    error: Error | null;
  };

  if (profileError) {
    return NextResponse.json(
      { error: "Errore caricamento profilo emergenza" },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          Pragma: "no-cache",
          "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
        },
      }
    );
  }

  const enabledProfile =
    rawProfile && rawProfile.enabled
      ? {
          ...rawProfile,
          animal_name: rawProfile.animal_name ?? animal.name,
          species: rawProfile.species ?? animal.species,
        }
      : null;

  const payload: EmergencyPublicPayload = {
    animal: {
      animalId: animal.animal_id,
      name: animal.name,
      species: animal.species,
      breed: animal.breed,
      color: animal.color,
    },
    emergency: enabledProfile,
    view: enabledProfile?.premium_enabled ? "advanced" : "basic",
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
    },
  });
}