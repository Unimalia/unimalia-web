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

type ExistingEmergencyQrTokenRow = {
  token_hash: string;
  status: "active" | "revoked" | "rotated";
  expires_at: string | null;
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

  const existingQuery = admin
    .from("emergency_qr_tokens" as never)
    .select("token_hash, status, expires_at")
    .eq("animal_id", animalId)
    .eq("status", "active")
    .maybeSingle();

  const { data: existing, error: existingError } = (await existingQuery) as unknown as {
    data: ExistingEmergencyQrTokenRow | null;
    error: Error | null;
  };

  if (existingError) {
    return NextResponse.json(
      { error: existingError.message },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  if (existing?.token_hash) {
    return NextResponse.json(
      {
        status: "exists",
        message:
          "Esiste già un token QR attivo per questo animale. In v1 il token non viene riesposto dopo la creazione.",
      },
      {
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