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
  animalId: string;
  eventDate: string; // YYYY-MM-DD (per ora)
  type: ClinicEventType;
  title: string;
  description?: string | null;

  // opzionale, se vuoi forzarlo lato client più avanti
  visibility?: "owner" | "professionals" | "emergency";
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
    if (!token) {
      return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: "Server misconfigured (Supabase env missing)" }, { status: 500 });
    }

    // Client Supabase con token utente (RLS attivo)
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verifica utente
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const animalId = (body.animalId || "").trim();
    const eventDate = (body.eventDate || "").trim();
    const type = body.type;
    const title = (body.title || "").trim();
    const description = (body.description ?? "").toString().trim() || null;

    if (!animalId) return NextResponse.json({ error: "animalId required" }, { status: 400 });
    if (!eventDate || !isValidDateYYYYMMDD(eventDate)) {
      return NextResponse.json({ error: "eventDate must be YYYY-MM-DD" }, { status: 400 });
    }
    if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

    const visibility = body.visibility ?? "owner";

    // Determina source in modo semplice:
    // - se è vet -> veterinarian, altrimenti professional
    // Nota: questa logica dipende da come avete i metadata. Se non c'è, cade su professional.
    const roleRaw =
      (userData.user.user_metadata?.role as string | undefined) ||
      (userData.user.app_metadata?.role as string | undefined) ||
      "";
    const isVet = /vet|veterin/i.test(roleRaw);
    const source = (isVet ? "veterinarian" : "professional") as "professional" | "veterinarian";

    // Insert evento
    const { data: inserted, error: insErr } = await supabase
      .from("clinic_events")
      .insert([
        {
          animal_id: animalId,
          event_date: eventDate,
          type,
          title,
          description,
          visibility,
          source,

          // se il DB ha questi campi e non sono richiesti, ok
          verified_at: source === "veterinarian" ? new Date().toISOString() : null,
          verified_by: source === "veterinarian" ? userData.user.id : null,
        },
      ])
      .select("*")
      .single();

    if (insErr) {
      // RLS/permessi tipicamente tornano qui
      const msg = insErr.message || "Insert failed";
      const status = /permission|not allowed|rls|forbidden/i.test(msg) ? 403 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json({ ok: true, event: inserted }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}