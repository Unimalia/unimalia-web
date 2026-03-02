import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = { id: string };

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json(
        { error: "Server misconfigured (Supabase env missing)" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const id = (body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Leggi evento per applicare regola permessi
    const { data: current, error: readErr } = await supabase
      .from("animal_clinic_events")
      .select("*")
      .eq("id", id)
      .single();

    if (readErr || !current) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const source = (current as any).source as string | undefined;
    const createdBy = ((current as any).created_by as string | null | undefined) ?? null;

    if (source !== "owner") {
      if (!createdBy || createdBy !== user.id) {
        return NextResponse.json(
          { error: "Non autorizzato: puoi eliminare solo eventi owner o i tuoi eventi." },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase.from("animal_clinic_events").delete().eq("id", id);
    if (error) {
      const msg = error.message || "Delete failed";
      const status = /permission|not allowed|rls|forbidden/i.test(msg) ? 403 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}