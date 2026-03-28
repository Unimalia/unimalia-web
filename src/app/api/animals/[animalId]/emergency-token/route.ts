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

function notFoundResponse() {
  return NextResponse.json(
    { error: "Not found" },
    {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

async function requireOwnedAnimal(animalId: string, userId: string) {
  const admin = supabaseAdmin();

  const { data: animal, error } = await admin
    .from("animals")
    .select("id, owner_id, name")
    .eq("id", animalId)
    .maybeSingle();

  if (error) {
    throw new Error("DB_ERROR");
  }

  if (!animal) {
    return { ok: false as const };
  }

  if (animal.owner_id !== userId) {
    return { ok: false as const };
  }

  return { ok: true as const, animal };
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { animalId } = await context.params;

    if (!animalId || !isUuid(animalId)) {
      return notFoundResponse();
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return notFoundResponse();
    }

    const owned = await requireOwnedAnimal(animalId, user.id);
    if (!owned.ok) {
      return notFoundResponse();
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
      return NextResponse.json(
        { error: "Server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
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
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { animalId } = await context.params;

    if (!animalId || !isUuid(animalId)) {
      return notFoundResponse();
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return notFoundResponse();
    }

    const owned = await requireOwnedAnimal(animalId, user.id);
    if (!owned.ok) {
      return notFoundResponse();
    }

    const admin = supabaseAdmin();

    const rotateResult = await admin
      .from("emergency_qr_tokens" as never)
      .update({ status: "rotated" } as never)
      .eq("animal_id", animalId)
      .eq("status", "active");

    if (rotateResult.error) {
      return NextResponse.json(
        { error: "Server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
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
      return NextResponse.json(
        { error: "Server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
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
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}