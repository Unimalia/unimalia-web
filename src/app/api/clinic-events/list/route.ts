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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const animalId = url.searchParams.get("animalId") || "";

    if (!animalId) {
      return NextResponse.json({ error: "animalId required" }, { status: 400 });
    }

    const token = readBearer(req);
    if (!token) {
      // ⚠️ fetch() dal browser spesso non mette Bearer automaticamente.
      // Se non c’è, proviamo con cookie session (Supabase) NON disponibile qui senza helper.
      // Quindi: richiediamo Bearer.
      return NextResponse.json({ error: "Missing Authorization Bearer token" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // ✅ verifica utente da access token
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const email = userData.user.email;

    // ✅ gate vet (bootstrap via allowlist email)
    if (!isVetEmail(email)) {
      return NextResponse.json({ error: "Not authorized (vet only)" }, { status: 403 });
    }

    // carica eventi clinici
    const { data, error } = await supabase
      .from("animal_clinic_events")
      .select(
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by, verified_by_label, verified_by_org_id, verified_by_member_id, created_at"
      )
      .eq("animal_id", animalId)
      .order("event_date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}