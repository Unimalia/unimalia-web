import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  supabaseAdmin,
} from "@/lib/supabase/server";
import {
  generateEmergencyToken,
  getEmergencyTokenPrefix,
  hashEmergencyToken,
} from "@/lib/emergency/token";

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

export async function POST(_req: Request, context: RouteContext) {
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

  const admin = supabaseAdmin();

  const { data: animal, error: animalError } = await admin
    .from("animals")
    .select("id, owner_id, name")
    .eq("id", animalId)
    .maybeSingle();

  if (animalError) {
    return NextResponse.json({ error: animalError.message }, { status: 500 });
  }

  if (!animal) {
    return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
  }

  if (animal.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rotateResult = await admin
    .from("emergency_qr_tokens" as never)
    .update({ status: "rotated" } as never)
    .eq("animal_id", animalId)
    .eq("status", "active");

  if (rotateResult.error) {
    return NextResponse.json({ error: rotateResult.error.message }, { status: 500 });
  }

  const token = generateEmergencyToken();
  const tokenHash = hashEmergencyToken(token);
  const tokenPrefix = getEmergencyTokenPrefix(token);

  const insertResult = await admin
    .from("emergency_qr_tokens" as never)
    .insert({
      animal_id: animalId,
      token_hash: tokenHash,
      token_prefix: tokenPrefix,
      status: "active",
    } as never);

  if (insertResult.error) {
    return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://unimalia.it";
  const url = `${baseUrl}/emergency/${token}`;

  return NextResponse.json(
    {
      status: "created",
      token,
      url,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}