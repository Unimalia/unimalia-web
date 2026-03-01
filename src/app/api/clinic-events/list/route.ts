import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isVetEmail(email?: string | null) {
  const e = String(email || "").toLowerCase().trim();
  const allow = new Set([
    "valentinotwister@hotmail.it",
    // aggiungi qui altre email vet autorizzate:
  ]);
  return allow.has(e);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const animalId = url.searchParams.get("animalId") || "";
    if (!animalId) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const auth = req.headers.get("authorization") || "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";

    if (!token) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const admin = supabaseAdmin();

    // ✅ verifica token → utente reale
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;

    if (userErr || !user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!isVetEmail(user.email)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { data, error } = await admin
      .from("animal_clinic_events")
      .select(
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by, verified_by_label, created_at"
      )
      .eq("animal_id", animalId)
      .order("event_date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, events: data ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server_error" }, { status: 500 });
  }
}