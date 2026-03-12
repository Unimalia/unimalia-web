import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const token = String(body?.token ?? "").trim();

    if (!token) {
      return NextResponse.json({ error: "Token mancante" }, { status: 400 });
    }

    const claimResult = await admin
      .from("animal_owner_claims")
      .select("id, animal_id, email, used_at, expires_at")
      .eq("claim_token", token)
      .single();

    if (claimResult.error || !claimResult.data) {
      return NextResponse.json({ error: "Invito non valido" }, { status: 404 });
    }

    const claim = claimResult.data;

    if (claim.used_at) {
      return NextResponse.json({ error: "Invito già utilizzato" }, { status: 409 });
    }

    if (claim.expires_at && new Date(claim.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Invito scaduto" }, { status: 410 });
    }

    const animalUpdate = await admin
      .from("animals")
      .update({
        owner_id: user.id,
        owner_claim_status: "claimed",
        owner_claimed_at: new Date().toISOString(),
      })
      .eq("id", claim.animal_id)
      .select("id")
      .single();

    if (animalUpdate.error || !animalUpdate.data) {
      return NextResponse.json(
        { error: animalUpdate.error?.message || "Errore collegamento animale" },
        { status: 500 }
      );
    }

    const claimUpdate = await admin
      .from("animal_owner_claims")
      .update({
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq("id", claim.id);

    if (claimUpdate.error) {
      return NextResponse.json(
        { error: claimUpdate.error.message || "Errore aggiornamento invito" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      animalId: animalUpdate.data.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore interno" },
      { status: 500 }
    );
  }
}