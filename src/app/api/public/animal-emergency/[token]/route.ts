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

export async function GET(_req: Request, context: RouteContext) {
  const { token } = await context.params;
  const safeToken = String(token ?? "").trim();

  if (!safeToken) {
    return NextResponse.json({ error: "Token mancante" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_animal_public", {
    p_token: safeToken,
  });

  if (error) {
    return NextResponse.json(
      { error: "Errore risoluzione token" },
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

  const animal = (data?.[0] as AnimalPublicRow | undefined) ?? null;

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
