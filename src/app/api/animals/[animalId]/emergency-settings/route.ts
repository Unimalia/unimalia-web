import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  supabaseAdmin,
} from "@/lib/supabase/server";
import { isUuid } from "@/lib/server/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    animalId: string;
  }>;
};

type EmergencySettingsRow = {
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
  updated_at?: string | null;
};

const DEFAULT_SETTINGS: Omit<EmergencySettingsRow, "animal_id" | "updated_at"> = {
  show_photo: true,
  show_name: true,
  show_species: true,
  show_breed: true,
  show_color: true,
  show_size: true,
  show_owner_name: false,
  show_owner_phone: false,
  show_allergies: true,
  show_therapies: true,
  show_chronic_conditions: true,
  show_blood_type: true,
  show_sterilization_status: true,
  emergency_notes: null,
};

async function requireOwnedAnimal(animalId: string, userId: string) {
  const admin = supabaseAdmin();

  const { data: animal, error } = await admin
    .from("animals")
    .select("id, owner_id")
    .eq("id", animalId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!animal) return { ok: false as const, status: 404, error: "Animale non trovato" };
  if (animal.owner_id !== userId) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const };
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { animalId } = await context.params;

    if (!animalId || !isUuid(animalId)) {
      return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const owned = await requireOwnedAnimal(animalId, user.id);
    if (!owned.ok) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    const admin = supabaseAdmin();

    const query = admin
      .from("animal_emergency_settings" as never)
      .select("*")
      .eq("animal_id", animalId)
      .maybeSingle();

    const { data, error } = (await query) as unknown as {
      data: EmergencySettingsRow | null;
      error: Error | null;
    };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        settings: data
          ? data
          : {
              animal_id: animalId,
              ...DEFAULT_SETTINGS,
            },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore interno lettura settings emergenza" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { animalId } = await context.params;

    if (!animalId || !isUuid(animalId)) {
      return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const owned = await requireOwnedAnimal(animalId, user.id);
    if (!owned.ok) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<EmergencySettingsRow>;

    const payload = {
      animal_id: animalId,
      show_photo: Boolean(body.show_photo),
      show_name: Boolean(body.show_name),
      show_species: Boolean(body.show_species),
      show_breed: Boolean(body.show_breed),
      show_color: Boolean(body.show_color),
      show_size: Boolean(body.show_size),
      show_owner_name: Boolean(body.show_owner_name),
      show_owner_phone: Boolean(body.show_owner_phone),
      show_allergies: Boolean(body.show_allergies),
      show_therapies: Boolean(body.show_therapies),
      show_chronic_conditions: Boolean(body.show_chronic_conditions),
      show_blood_type: Boolean(body.show_blood_type),
      show_sterilization_status: Boolean(body.show_sterilization_status),
      emergency_notes: String(body.emergency_notes ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    };

    const admin = supabaseAdmin();

    const result = await admin
      .from("animal_emergency_settings" as never)
      .upsert(payload as never, { onConflict: "animal_id" })
      .select("*")
      .single();

    const { data, error } = result as unknown as {
      data: EmergencySettingsRow | null;
      error: Error | null;
    };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, settings: data },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore interno salvataggio settings emergenza" },
      { status: 500 }
    );
  }
}