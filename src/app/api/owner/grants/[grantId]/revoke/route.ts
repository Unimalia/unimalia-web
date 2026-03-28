import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  supabaseAdmin,
} from "@/lib/supabase/server";
import { isUuid } from "@/lib/server/validators";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ grantId: string }> }
) {
  try {
    const { grantId } = await ctx.params;

    if (!grantId) {
      return NextResponse.json({ error: "grantId mancante" }, { status: 400 });
    }

    if (!isUuid(grantId)) {
      return NextResponse.json({ error: "grantId non valido" }, { status: 400 });
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

    if (grant.grantee_type !== "org") {
      return NextResponse.json({ error: "Grant type non supportato" }, { status: 400 });
    }

    if (grant.revoked_at || grant.status === "revoked") {
      return NextResponse.json({ ok: true }, { status: 200 });
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

    const nowIso = new Date().toISOString();

    const { error: updErr } = await admin
      .from("animal_access_grants")
      .update({
        revoked_at: nowIso,
        revoked_by_user_id: user.id,
        status: "revoked",
      })
      .eq("id", grantId)
      .is("revoked_at", null);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore revoca grant" },
      { status: 500 }
    );
  }
}