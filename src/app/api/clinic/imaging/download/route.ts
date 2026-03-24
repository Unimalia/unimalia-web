import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSignedDownloadUrl } from "@/lib/storage";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";
import { supabaseAdmin } from "@/lib/supabase/server";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const admin = supabaseAdmin();

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const eventId = body?.eventId;
    const filePath = body?.filePath;

    if (!eventId || !filePath) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
    }

    const { data: fileRow, error: fileError } = await admin
      .from("animal_clinic_event_files")
      .select("id, event_id, animal_id, path")
      .eq("event_id", eventId)
      .eq("path", filePath)
      .single();

    if (fileError || !fileRow) {
      return NextResponse.json({ error: "File non trovato" }, { status: 404 });
    }

    const animalId = fileRow.animal_id;

    const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "read");

    if (!grant.ok) {
      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        action: "imaging.download",
        target_type: "file",
        target_id: fileRow.id,
        animal_id: animalId,
        result: "denied",
        reason: grant.reason,
      });

      return NextResponse.json({ error: grant.reason }, { status: 403 });
    }

    const signedUrl = await createSignedDownloadUrl(fileRow.path, 60);

    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "imaging.download",
      target_type: "file",
      target_id: fileRow.id,
      animal_id: animalId,
      result: "success",
    });

    return NextResponse.json({ ok: true, url: signedUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Errore download imaging" },
      { status: 500 }
    );
  }
}