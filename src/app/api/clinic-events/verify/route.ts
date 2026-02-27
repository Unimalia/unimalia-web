// src/app/api/clinic-events/verify/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isVetEmail(email?: string | null) {
  const e = String(email || "").toLowerCase();
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const eventId = String(body?.eventId || "").trim();
    const verifiedByLabel = String(body?.verifiedByLabel || "Veterinario").trim();

    if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

    const admin = supabaseAdmin();
    const now = new Date().toISOString();

    const { error } = await admin
      .from("animal_clinic_events")
      .update({
        source: "professional",
        verified_at: now,
        verified_by_label: verifiedByLabel,
      })
      .eq("id", eventId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}