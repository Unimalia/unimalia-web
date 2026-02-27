import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !key) throw new Error("Missing Supabase env (URL or SERVICE_ROLE_KEY).");

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function isVetEmail(email?: string | null) {
  const e = String(email || "").toLowerCase();
  const allow = new Set([
    "valentinotwister@hotmail.it",
    // aggiungi qui altre email vet abilitate:
  ]);
  return allow.has(e);
}

function readBearer(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function POST(req: Request) {
  try {
    const token = readBearer(req);
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization Bearer token" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const eventId = String(body?.eventId || "").trim();

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const user = userData.user;
    if (!isVetEmail(user.email)) {
      return NextResponse.json({ error: "Not authorized (vet only)" }, { status: 403 });
    }

    const now = new Date().toISOString();

    // ✅ aggiorna evento: mark “professional/verified”
    const { error: upErr } = await supabase
      .from("animal_clinic_events")
      .update({
        source: "professional",
        verified_at: now,
        verified_by: user.id,
        verified_by_label: "Veterinario",
      })
      .eq("id", eventId);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}