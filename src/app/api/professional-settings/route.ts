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

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const user = await requireUser(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = supabaseAnon(authHeader);

  const { data, error } = await sb
    .from("professional_settings")
    .select("cap_pending,blocked")
    .eq("professional_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    cap_pending: data?.cap_pending ?? 20,
    blocked: data?.blocked ?? false,
  });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const user = await requireUser(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const cap_pending = Number(body?.cap_pending ?? 20);
  const blocked = Boolean(body?.blocked ?? false);

  if (!Number.isFinite(cap_pending) || cap_pending < 1 || cap_pending > 999) {
    return NextResponse.json({ error: "Invalid cap_pending" }, { status: 400 });
  }

  const sb = supabaseAnon(authHeader);

  const { error } = await sb
    .from("professional_settings")
    .upsert({ professional_id: user.id, cap_pending, blocked }, { onConflict: "professional_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}