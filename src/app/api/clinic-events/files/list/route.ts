import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function GET(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: "Server misconfigured (Supabase env missing)" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const url = new URL(req.url);
    const eventId = (url.searchParams.get("eventId") || "").trim();
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("animal_clinic_event_files")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message || "Query failed" }, { status: 400 });

    return NextResponse.json({ ok: true, files: data ?? [] }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}