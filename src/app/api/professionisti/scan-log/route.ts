import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAnon(authHeader: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

async function requireUser(authHeader: string | null) {
  const sb = supabaseAnon(authHeader);
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const user = await requireUser(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);

  const raw = String(body?.raw ?? "");
  const normalized = String(body?.normalized ?? "");
  const outcome = String(body?.outcome ?? "");
  const animalId = body?.animalId ? String(body.animalId) : null;
  const note = body?.note ? String(body.note) : null;

  if (!raw || !normalized || !["success", "not_found", "invalid"].includes(outcome)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const sb = supabaseAnon(authHeader);

  const { error } = await sb.from("professional_scan_logs").insert({
    professional_id: user.id,
    raw,
    normalized,
    outcome,
    animal_id: animalId,
    note,
  });

  if (error) {
    // Non blocchiamo lo scanner: ritorniamo 200 ma segnaliamo
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}