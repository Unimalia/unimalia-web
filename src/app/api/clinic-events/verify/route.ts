import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isVetEmail(email?: string | null) {
  const e = String(email || "").toLowerCase().trim();
  const allow = new Set([
    "valentinotwister@hotmail.it",
    // altre email vet
  ]);
  return allow.has(e);
}

export async function POST(req: Request) {
  try {
    const userEmail = req.headers.get("x-user-email");
    if (!isVetEmail(userEmail)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);

    // ✅ supporta SOLO batch: { eventIds: string[] }
    const eventIds: string[] = Array.isArray(body?.eventIds) ? body.eventIds : [];

    // sanitizza ids
    const cleanIds = eventIds.map((x) => String(x).trim()).filter(Boolean);

    if (cleanIds.length === 0) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const admin = supabaseAdmin(); // ✅ sempre chiamare

    const now = new Date().toISOString();

    // ✅ aggiorna in batch: verified_at
    // (verified_by / verified_org_id li aggiungiamo quando colleghiamo professional_profiles)
    const { error } = await admin
      .from("animal_clinic_events")
      .update({
        verified_at: now,
      })
      .in("id", cleanIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server_error" }, { status: 500 });
  }
}