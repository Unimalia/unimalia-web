import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ClinicEventType =
  | "visit"
  | "vaccine"
  | "exam"
  | "therapy"
  | "note"
  | "document"
  | "emergency";

type Body = {
  id: string;
  title: string;
  type: ClinicEventType;
  eventDate: string; // YYYY-MM-DD
  description?: string | null;
};

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

function isValidDateYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
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
    const title = (body.title || "").trim();
    const type = body.type;
    const eventDate = (body.eventDate || "").trim();
    const description = (body.description ?? "").toString().trim() || null;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });
    if (!eventDate || !isValidDateYYYYMMDD(eventDate)) {
      return NextResponse.json({ error: "eventDate must be YYYY-MM-DD" }, { status: 400 });
    }

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

    // Regola PRO:
    // - edit consentito se source=owner
    // - se source!=owner serve created_by === user.id (se campo disponibile)
    if (source !== "owner") {
      if (!createdBy || createdBy !== user.id) {
        return NextResponse.json(
          { error: "Non autorizzato: puoi modificare solo eventi owner o i tuoi eventi." },
          { status: 403 }
        );
      }
    }

    const { data, error } = await supabase
      .from("animal_clinic_events")
      .update({
        title,
        type,
        event_date: eventDate,
        description,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      const msg = error.message || "Update failed";
      const status = /permission|not allowed|rls|forbidden/i.test(msg) ? 403 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json({ ok: true, event: data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}