import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAnon(authHeader: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

async function requireProfessionalUser(authHeader: string | null) {
  const sb = supabaseAnon(authHeader);
  const { data, error } = await sb.auth.getUser();

  if (error || !data.user) return null;

  const user = data.user;
  const isProfessional = user.app_metadata?.is_professional === true || user.app_metadata?.is_vet === true;

  if (!isProfessional) return null;

  return user;
}

function genCode() {
  return `EMG-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const user = await requireProfessionalUser(authHeader);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseAnon(authHeader);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  const { data: existing, error: existingError } = await sb
    .from("emergency_codes")
    .select("code, expires_at")
    .eq("professional_id", user.id)
    .eq("is_used", false)
    .gt("expires_at", now.toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 400 });
  }

  if (existing?.code && existing?.expires_at) {
    return NextResponse.json(
      { code: existing.code, expires_at: existing.expires_at },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const code = genCode();

  const { error } = await sb.from("emergency_codes").insert({
    professional_id: user.id,
    code,
    expires_at: expiresAt,
    is_used: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    { code, expires_at: expiresAt },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}