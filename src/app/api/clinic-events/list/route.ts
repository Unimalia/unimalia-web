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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const animalId =
      url.searchParams.get("animalId") ||
      url.searchParams.get("id") ||
      url.searchParams.get("animal");

    if (!animalId) {
      return NextResponse.json({ error: "Missing animalId" }, { status: 400 });
    }

    // ✅ passpartout rapido (finché non mettiamo professional_profiles)
    const userEmail = req.headers.get("x-user-email");
    if (!isVetEmail(userEmail)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = supabaseAdmin(); // ✅ sempre chiamare

    const { data, error } = await admin
      .from("animal_clinic_events")
      .select(
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by, verified_org_id, created_at"
      )
      .eq("animal_id", animalId)
      .order("event_date", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ events: data ?? [] }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}