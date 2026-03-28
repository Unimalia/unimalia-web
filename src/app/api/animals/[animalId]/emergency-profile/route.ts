import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { isUuid } from "@/lib/server/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    animalId: string;
  }>;
};

function notFoundResponse() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(
  _req: Request,
  ctx: RouteContext
) {
  try {
    const { animalId } = await ctx.params;

    if (!animalId || !isUuid(animalId)) {
      return notFoundResponse();
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return notFoundResponse();
    }

    const admin = supabaseAdmin();

    const { data: animal } = await admin
      .from("animals")
      .select("id, owner_id, name, species")
      .eq("id", animalId)
      .maybeSingle();

    if (!animal) {
      return notFoundResponse();
    }

    if (animal.owner_id !== user.id) {
      return notFoundResponse();
    }

    const { data: existing } = await admin
      .from("animal_emergency_profiles")
      .select("*")
      .eq("animal_id", animalId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(existing, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const profile = {
      animal_id: animalId,
      enabled: false,
      animal_name: animal.name,
      species: animal.species,
      weight_kg: null,
      allergies: null,
      active_therapies: null,
      chronic_conditions: null,
      is_lost: false,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      show_emergency_contact: false,
      premium_enabled: false,
      essential_vaccination_status: null,
      advanced_summary: null,
      last_visit_summary: null,
      last_vaccination_summary: null,
    };

    const { data, error } = await admin
      .from("animal_emergency_profiles")
      .insert(profile)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  ctx: RouteContext
) {
  try {
    const { animalId } = await ctx.params;

    if (!animalId || !isUuid(animalId)) {
      return notFoundResponse();
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return notFoundResponse();
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return notFoundResponse();
    }

    const admin = supabaseAdmin();

    const { data: animal } = await admin
      .from("animals")
      .select("id, owner_id")
      .eq("id", animalId)
      .maybeSingle();

    if (!animal) {
      return notFoundResponse();
    }

    if (animal.owner_id !== user.id) {
      return notFoundResponse();
    }

    const { data, error } = await admin
      .from("animal_emergency_profiles")
      .update(body)
      .eq("animal_id", animalId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}