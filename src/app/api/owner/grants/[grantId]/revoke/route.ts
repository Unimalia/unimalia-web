import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  supabaseAdmin,
} from "@/lib/supabase/server";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ grantId: string }> }
) {
  try {
    const { grantId } = await ctx.params;

    if (!grantId || !isUuid(grantId)) {
      return NextResponse.json({ error: "Invalid grantId" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = supabaseAdmin();

    const { data: grant, error: gErr } = await admin
      .from("animal_access_grants")
      .select("id, animal_id, grantee_type, grantee_id, revoked_at, status")
      .eq("id", grantId)
      .maybeSingle();

    if (gErr) {
      return NextResponse.json({ error: gErr.message }, { status: 500 });
    }

    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    if (grant.revoked_at || grant.status === "revoked") {
      return NextResponse.json({ ok: true });
    }

    const { data: animal, error: aErr } = await supabase
      .from("animals")
      .select("id, owner_id")
      .eq("id", grant.animal_id)
      .maybeSingle();

    if (aErr) {
      return NextResponse.json({ error: aErr.message }, { status: 500 });
    }

    if (!animal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 });
    }

    if (animal.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const revokedAt = new Date().toISOString();

    const { error: updErr } = await admin
      .from("animal_access_grants")
      .update({
        revoked_at: revokedAt,
        revoked_by_user_id: user.id,
        status: "revoked",
      })
      .eq("id", grantId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    const { error: reqUpdErr } = await admin
      .from("animal_access_requests")
      .update({
        status: "revoked",
      })
      .eq("animal_id", grant.animal_id)
      .eq("org_id", grant.grantee_id)
      .in("status", ["approved", "active", "pending"]);

    if (reqUpdErr) {
      return NextResponse.json({ error: reqUpdErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Errore revoca grant",
      },
      { status: 500 }
    );
  }
}