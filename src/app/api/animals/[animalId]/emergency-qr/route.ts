import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  supabaseAdmin,
} from "@/lib/supabase/server";
import { createEmergencyQrToken } from "@/lib/emergency/create-token";
import { isUuid } from "@/lib/server/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    animalId: string;
  }>;
};

function notFoundResponse() {
  return NextResponse.json(
    { error: "Not found" },
    {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { animalId } = await context.params;

    if (!animalId || animalId === "undefined" || !isUuid(animalId)) {
      return notFoundResponse();
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return notFoundResponse();
    }

    const { data: animal, error: animalErr } = await supabase
      .from("animals")
      .select("id, owner_id, name")
      .eq("id", animalId)
      .maybeSingle();

    if (animalErr) {
      return NextResponse.json(
        { error: "Server error" },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    if (!animal) {
      return notFoundResponse();
    }

    if (!animal.owner_id || animal.owner_id !== user.id) {
      return notFoundResponse();
    }

    const admin = supabaseAdmin();

    const { error: rotateError } = await admin
      .from("emergency_qr_tokens" as never)
      .update({ status: "rotated" } as never)
      .eq("animal_id", animalId)
      .eq("status", "active");

    if (rotateError) {
      return NextResponse.json(
        { error: "Server error" },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
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
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}