import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      return NextResponse.json({ error: "Server misconfigured (Supabase env missing)" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const eventId = String(form.get("eventId") || "").trim();
    const animalId = String(form.get("animalId") || "").trim();
    const files = form.getAll("files");

    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });
    if (!animalId) return NextResponse.json({ error: "animalId required" }, { status: 400 });
    if (!files.length) return NextResponse.json({ error: "files required" }, { status: 400 });

    const bucket = "clinic-event-files"; // crea questo bucket in Supabase Storage

    const uploaded: any[] = [];

    for (const f of files) {
      if (!(f instanceof File)) continue;

      const safeName = (f.name || "documento")
        .replace(/[^\w.\-() ]+/g, "_")
        .slice(0, 120);

      const path = `${animalId}/${eventId}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, f, {
        contentType: f.type || undefined,
        upsert: false,
      });

      if (upErr) {
        return NextResponse.json({ error: upErr.message || "Upload failed" }, { status: 400 });
      }

      // Inserisci riga allegato
      const { data: row, error: insErr } = await supabase
        .from("animal_clinic_event_files")
        .insert([
          {
            event_id: eventId,
            animal_id: animalId,
            path,
            filename: f.name || safeName,
            mime: f.type || null,
            size: f.size || null,
            created_by: user.id,
          },
        ])
        .select("*")
        .single();

      if (insErr) {
        return NextResponse.json({ error: insErr.message || "DB insert failed" }, { status: 400 });
      }

      uploaded.push(row);
    }

    return NextResponse.json({ ok: true, files: uploaded }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}