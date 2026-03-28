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
import { isUuid } from "@/lib/server/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    animalId: string;
  }>;
};

type EmergencyTokenRow = {
  id: string;
  animal_id: string;
  public_token: string | null;
  token_hash: string;
  token_prefix: string;
  status: "active" | "revoked" | "rotated";
  expires_at: string | null;
  created_at?: string | null;
};

function buildPublicUrl(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://unimalia.it";
  return `${baseUrl}/emergency/${token}`;
}

async function requireOwnedAnimal(animalId: string, userId: string) {
  const admin = supabaseAdmin();

  const { data: animal, error } = await admin
    .from("animals")
    .select("id, owner_id, name")
    .eq("id", animalId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!animal) {
    return { ok: false as const, status: 404, error: "Animale non trovato" };
  }

  if (animal.owner_id !== userId) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, animal };
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
      .from("emergency_qr_tokens" as never)
      .select("id, animal_id, public_token, token_hash, token_prefix, status, expires_at, created_at")
      .eq("animal_id", animalId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = (await query) as unknown as {
      data: EmergencyTokenRow | null;
      error: Error | null;
    };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || !data.public_token) {
      return NextResponse.json(
        { ok: true, hasActiveToken: false, token: null, url: null },
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        hasActiveToken: true,
        token: data.public_token,
        url: buildPublicUrl(data.public_token),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore interno lettura QR emergenza" },
      { status: 500 }
    );
  }
}

export async function POST(_req: Request, context: RouteContext) {
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
        public_token: token,
        token_hash: tokenHash,
        token_prefix: tokenPrefix,
        status: "active",
      } as never);

    if (insertResult.error) {
      return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        status: "created",
        token,
        url: buildPublicUrl(token),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore interno generazione QR emergenza" },
      { status: 500 }
    );
  }
}