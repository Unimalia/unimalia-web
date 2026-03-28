import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { isUuid } from "@/lib/server/validators";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ animalId: string }> }
) {
  const { animalId } = await ctx.params;

  if (!animalId || !isUuid(animalId)) {
    return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = supabaseAdmin();

  const { data: animal } = await admin
    .from("animals")
    .select("id, owner_id, name, species")
    .eq("id", animalId)
    .maybeSingle();

  if (!animal) {
    return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  }

  if (animal.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existing } = await admin
    .from("animal_emergency_profiles")
    .select("*")
    .eq("animal_id", animalId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(existing);
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ animalId: string }> }
) {
  const { animalId } = await ctx.params;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  const admin = supabaseAdmin();

  const { data: animal } = await admin
    .from("animals")
    .select("owner_id")
    .eq("id", animalId)
    .single();

  if (!animal || animal.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("animal_emergency_profiles")
    .update(body)
    .eq("animal_id", animalId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}