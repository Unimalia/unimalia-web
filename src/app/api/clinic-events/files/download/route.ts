import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";

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

export async function GET(req: Request) {
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

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const fileId = (url.searchParams.get("fileId") || "").trim();
  const pathParam = (url.searchParams.get("path") || "").trim();

  let fileRow: any = null;

  if (fileId) {
    if (!isUuid(fileId)) {
      return NextResponse.json({ error: "fileId invalid" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("animal_clinic_event_files")
      .select("id, animal_id, event_id, path, filename")
      .eq("id", fileId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    fileRow = data;
  } else if (pathParam) {
    const { data, error } = await admin
      .from("animal_clinic_event_files")
      .select("id, animal_id, event_id, path, filename")
      .eq("path", pathParam)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    fileRow = data;
  } else {
    return NextResponse.json({ error: "fileId or path required" }, { status: 400 });
  }

  const animalId = String(fileRow.animal_id);
  const eventId = String(fileRow.event_id);

  const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "read");

  let canAccess = grant.ok;
  let accessMode: "full" | "own_only" | "denied" = grant.ok ? "full" : "denied";

  if (!grant.ok) {
    const { data: eventRow, error: eventError } = await admin
      .from("animal_clinic_events")
      .select("id, created_by, animal_id, status")
      .eq("id", eventId)
      .eq("animal_id", animalId)
      .neq("status", "void")
      .maybeSingle();

    if (eventError) {
      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        action: "file.download",
        target_type: "file",
        target_id: fileRow.id,
        animal_id: animalId,
        result: "error",
        reason: eventError.message,
      });

      return NextResponse.json({ error: "Errore verifica accesso file." }, { status: 500 });
    }

    if (eventRow && eventRow.created_by === user.id) {
      canAccess = true;
      accessMode = "own_only";
    }
  }

  if (!canAccess) {
    const denyReason = grant.ok ? "Accesso negato" : grant.reason;

    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      action: "file.download",
      target_type: "file",
      target_id: fileRow.id,
      animal_id: animalId,
      result: "denied",
      reason: denyReason,
    });

    return NextResponse.json({ error: denyReason }, { status: 403 });
  }

  const { data, error } = await admin.storage
    .from("clinic-event-files")
    .createSignedUrl(fileRow.path, 60);

  if (error || !data?.signedUrl) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.ok ? grant.actor_org_id : null,
      action: "file.download",
      target_type: "file",
      target_id: fileRow.id,
      animal_id: animalId,
      result: "error",
      reason: error?.message || "signed url failed",
    });

    return NextResponse.json({ error: "Impossibile generare link download." }, { status: 500 });
  }

  await writeAudit(supabase, {
    req,
    actor_user_id: user.id,
    actor_org_id: grant.ok ? grant.actor_org_id : null,
    action: "file.download",
    target_type: "file",
    target_id: fileRow.id,
    animal_id: animalId,
    result: "success",
    reason: accessMode === "own_only" ? "fallback_own_event_file_only" : undefined,
  });

  return NextResponse.json(
    {
      ok: true,
      mode: accessMode,
      url: data.signedUrl,
      filename: fileRow.filename ?? null,
    },
    { status: 200 }
  );
}