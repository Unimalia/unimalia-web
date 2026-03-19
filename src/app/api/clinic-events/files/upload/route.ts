import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";
import { supabaseAdmin } from "@/lib/supabase/server";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }

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

  const admin = supabaseAdmin();

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const user = userData?.user;

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();

    const eventId = String(form.get("eventId") || "").trim();
    const files = form.getAll("files");

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    if (!isUuid(eventId)) {
      return NextResponse.json({ error: "eventId invalid" }, { status: 400 });
    }

    if (!files.length) {
      return NextResponse.json({ error: "files required" }, { status: 400 });
    }

    const { data: ev, error: evErr } = await admin
      .from("animal_clinic_events")
      .select("id, animal_id, status")
      .eq("id", eventId)
      .neq("status", "void")
      .single();

    if (evErr || !ev) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const animalId = ev.animal_id as string;

    const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "upload");
    if (!grant.ok) {
      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        action: "file.upload",
        target_type: "event",
        target_id: eventId,
        animal_id: animalId,
        result: "denied",
        reason: grant.reason,
      });

      return NextResponse.json({ error: grant.reason }, { status: 403 });
    }

    const bucket = "clinic-event-files";

    const uploaded: Array<{
      id: string;
      event_id: string;
      animal_id: string;
      path: string;
      filename: string | null;
      mime: string | null;
      size: number | null;
      created_by: string | null;
      created_at: string;
    }> = [];

    for (const entry of files) {
      if (!(entry instanceof File)) {
        continue;
      }

      if (entry.size <= 0 || entry.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File non valido o troppo grande (max 10 MB)" },
          { status: 400 }
        );
      }

      if (entry.type && !ALLOWED_MIME_TYPES.has(entry.type)) {
        return NextResponse.json({ error: "Tipo file non consentito" }, { status: 400 });
      }

      const safeName = (entry.name || "documento")
        .replace(/[^\w.\-() ]+/g, "_")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);

      const path = `${animalId}/${eventId}/${Date.now()}_${safeName}`;

      const arrayBuffer = await entry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: upErr } = await admin.storage.from(bucket).upload(path, buffer, {
        contentType: entry.type || "application/octet-stream",
        upsert: false,
      });

      if (upErr) {
        await writeAudit(supabase, {
          req,
          actor_user_id: user.id,
          actor_org_id: grant.actor_org_id,
          action: "file.upload",
          target_type: "event",
          target_id: eventId,
          animal_id: animalId,
          result: "error",
          reason: upErr.message,
        });

        return NextResponse.json(
          { error: upErr.message || "Upload failed" },
          { status: 400 }
        );
      }

      const { data: row, error: insErr } = await admin
        .from("animal_clinic_event_files")
        .insert({
          event_id: eventId,
          animal_id: animalId,
          path,
          filename: entry.name || safeName,
          mime: entry.type || null,
          size: entry.size || null,
          created_by: user.id,
        })
        .select("id, event_id, animal_id, path, filename, mime, size, created_by, created_at")
        .single();

      if (insErr || !row) {
        try {
          await admin.storage.from(bucket).remove([path]);
        } catch {
          // ignore cleanup error
        }

        await writeAudit(supabase, {
          req,
          actor_user_id: user.id,
          actor_org_id: grant.actor_org_id,
          action: "file.upload",
          target_type: "event",
          target_id: eventId,
          animal_id: animalId,
          result: "error",
          reason: insErr?.message || "DB insert failed",
        });

        return NextResponse.json(
          { error: insErr?.message || "DB insert failed" },
          { status: 400 }
        );
      }

      uploaded.push(row);
    }

    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "file.upload",
      target_type: "event",
      target_id: eventId,
      animal_id: animalId,
      result: "success",
      diff: { uploadedCount: uploaded.length },
    });

    return NextResponse.json({ ok: true, files: uploaded }, { status: 200 });
  } catch (error: any) {
    console.error("[CLINIC_EVENT_FILE_UPLOAD_ERROR]", error);

    return NextResponse.json(
      { error: error?.message || "Server error during file upload" },
      { status: 500 }
    );
  }
}