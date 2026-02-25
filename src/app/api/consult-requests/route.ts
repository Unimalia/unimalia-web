import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

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

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const user = await requireUser(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const q = (searchParams.get("q") || "").trim();

  // lista per professionista = auth.uid()
  const sb = supabaseAnon(authHeader);

  let query = sb
    .from("consult_requests")
    .select("id,created_at,updated_at,animal_id,animal_name,owner_name,message,status,is_emergency,expires_at")
    .eq("professional_id", user.id)
    .eq("status", status)
    .order("is_emergency", { ascending: false })
    .order("created_at", { ascending: false });

  if (q) {
    // ilike su animal_name / owner_name
    query = query.or(`animal_name.ilike.%${q}%,owner_name.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const user = await requireUser(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const {
    professionalId,
    animalId,
    animalName,
    ownerName,
    message,
    emergencyCode,
  } = body as {
    professionalId: string;
    animalId: string;
    animalName?: string;
    ownerName?: string;
    message?: string;
    emergencyCode?: string;
  };

  if (!professionalId || !animalId) {
    return NextResponse.json({ error: "Missing professionalId/animalId" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // 1) controlla impostazioni professionista (cap + blocco)
  const { data: settings } = await admin
    .from("professional_settings")
    .select("cap_pending,blocked")
    .eq("professional_id", professionalId)
    .maybeSingle();

  const capPending = settings?.cap_pending ?? 20;
  const blocked = settings?.blocked ?? false;

  // 2) controlla pending count
  const { count: pendingCount } = await admin
    .from("consult_requests")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId)
    .eq("status", "pending");

  const capReached = (pendingCount ?? 0) >= capPending;

  // 3) verifica codice emergenza (se presente)
  let emergencyOk = false;
  let emergencyRowId: string | null = null;
  const code = (emergencyCode || "").trim().toUpperCase();

  if (code) {
    const { data: emg } = await admin
      .from("emergency_codes")
      .select("id,expires_at,is_used")
      .eq("professional_id", professionalId)
      .eq("code", code)
      .maybeSingle();

    if (emg && !emg.is_used && new Date(emg.expires_at).getTime() > Date.now()) {
      emergencyOk = true;
      emergencyRowId = emg.id;
    }
  }

  // 4) blocchi: passano solo emergenze valide
  if ((blocked || capReached) && !emergencyOk) {
    return NextResponse.json(
      { error: "Professional is not accepting new requests. Try later." },
      { status: 429 }
    );
  }

  // 5) crea richiesta
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // es. scade in 24h (modificabile)
  const { data: inserted, error: insErr } = await admin
    .from("consult_requests")
    .insert({
      owner_id: user.id,
      professional_id: professionalId,
      animal_id: animalId,
      animal_name: animalName ?? null,
      owner_name: ownerName ?? null,
      message: message ?? null,
      status: "pending",
      is_emergency: emergencyOk,
      emergency_code: emergencyOk ? code : null,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

  // 6) marca codice emergenza come usato (single-use)
  if (emergencyOk && emergencyRowId) {
    await admin.from("emergency_codes").update({ is_used: true }).eq("id", emergencyRowId);
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}