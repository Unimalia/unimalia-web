// src/app/api/clinic-events/verify/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

    const eventIds: string[] = Array.isArray(body?.eventIds) ? body.eventIds : [];
    const verifiedByLabel = String(body?.verifiedByLabel || "Veterinario").trim();

    const cleanIds = eventIds.map((x) => String(x).trim()).filter(Boolean);
    if (cleanIds.length === 0) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    // ✅ nel tuo progetto è una FUNZIONE
    const admin = supabaseAdmin();

    const now = new Date().toISOString();

    const { error } = await admin
      .from("animal_clinic_events")
      .update({
        verified_at: now,
        verified_by_label: verifiedByLabel,
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