import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  supabaseAdmin,
} from "@/lib/supabase/server";
import { createEmergencyQrToken } from "@/lib/emergency/create-token";

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

export async function GET(_req: Request, context: RouteContext) {
  const { animalId } = await context.params;

  if (!animalId || animalId === "undefined") {
    return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
  }

  if (!isUuid(animalId)) {
    return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: animal, error: animalErr } = await supabase
    .from("animals")
    .select("id, owner_id, name")
    .eq("id", animalId)
    .maybeSingle();

  if (animalErr) {
    return NextResponse.json({ error: animalErr.message }, { status: 500 });
  }

  if (!animal) {
    return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  }

  if (!animal.owner_id || animal.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = supabaseAdmin();

  const { error: rotateError } = await admin
    .from("emergency_qr_tokens" as never)
    .update({ status: "rotated" } as never)
    .eq("animal_id", animalId)
    .eq("status", "active");

  if (rotateError) {
    return NextResponse.json(
      { error: rotateError.message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const created = await createEmergencyQrToken(animalId);

  return NextResponse.json(
    {
      status: "created",
      token: created.token,
      url: created.url,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}