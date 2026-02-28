// src/app/api/clinic-events/verify/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentUserFromBearerOrThrow } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // ✅ utente reale verificato con token Supabase
    const user = await getCurrentUserFromBearerOrThrow(req);

    // ✅ allowlist TEMP (poi la togliamo quando hai membership/ruoli)
    const allow = new Set([
      "valentinotwister@hotmail.it",
      // altre email vet
    ]);
    if (!allow.has((user.email ?? "").toLowerCase().trim())) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);

    const eventIds: string[] = Array.isArray(body?.eventIds) ? body.eventIds : [];
    const verifiedByLabel = String(body?.verifiedByLabel || "Veterinario").trim();

    const cleanIds = eventIds.map((x) => String(x).trim()).filter(Boolean);
    if (cleanIds.length === 0) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const now = new Date().toISOString();

    const { error } = await admin
      .from("animal_clinic_events")
      .update({
        verified_at: now,
        verified_by_label: verifiedByLabel,

        // 🔜 FUTURO (quando aggiungi colonne):
        // verified_by_user_id: user.id,
        // verified_org_id: actingOrgId,
      })
      .in("id", cleanIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const msg = e?.message || "server_error";
    const status = msg === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}