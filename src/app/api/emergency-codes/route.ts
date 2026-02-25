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

function genCode() {
  return "EMG-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const user = await requireUser(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = supabaseAnon(authHeader);

  const code = genCode();
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await sb.from("emergency_codes").insert({
    professional_id: user.id,
    code,
    expires_at,
    is_used: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ code, expires_at });
}