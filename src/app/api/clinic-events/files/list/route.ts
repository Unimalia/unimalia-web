import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";

type ClinicEventRow = {
  id: string;
  animal_id: string;
  status: string | null;
  created_by_user_id: string | null;
};

type ClinicEventFileRow = {
  id: string;
  event_id: string;
  animal_id: string;
  path: string;
  filename: string | null;
  mime: string | null;
  size: number | null;
  created_by_user_id: string | null;
  created_at: string;
};

type RequireOwnerOrGrantClient = Parameters<typeof requireOwnerOrGrant>[0];

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
  const eventId = String(url.searchParams.get("eventId") || "").trim();

  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  if (!isUuid(eventId)) {
    return NextResponse.json({ error: "eventId invalid" }, { status: 400 });
  }

  const { data: ev, error: evErr } = await admin
    .from("animal_clinic_events")
    .select("id, animal_id, status, created_by_user_id")
    .eq("id", eventId)
    .neq("status", "void")
    .single<ClinicEventRow>();

  if (evErr || !ev) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const animalId = String(ev.animal_id);

  const grant = await requireOwnerOrGrant(
    supabase as RequireOwnerOrGrantClient,
    user.id,
    animalId,
    "read"
  );

  let canAccess = grant.ok;
  let accessMode: "full" | "own_only" | "denied" = grant.ok ? "full" : "denied";

  if (!grant.ok && ev.created_by_user_id === user.id) {
    canAccess = true;
    accessMode = "own_only";
  }

  if (!canAccess) {
    const denyReason = grant.ok ? "Accesso negato" : grant.reason;

    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      action: "file.list",
      target_type: "event",
      target_id: eventId,
      animal_id: animalId,
      result: "denied",
      reason: denyReason,
    });

    return NextResponse.json({ error: denyReason }, { status: 403 });
  }

  const { data, error } = await admin
    .from("animal_clinic_event_files")
    .select("id, event_id, animal_id, path, filename, mime, size, created_by_user_id, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })
    .returns<ClinicEventFileRow[]>();

  if (error) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_organization_id: grant.ok ? grant.actor_organization_id : null,
      action: "file.list",
      target_type: "event",
      target_id: eventId,
      animal_id: animalId,
      result: "error",
      reason: error.message,
    });

    return NextResponse.json({ error: error.message || "Query failed" }, { status: 400 });
  }

  await safeWriteAudit(supabase, {
    req,
    actor_user_id: user.id,
    actor_organization_id: grant.ok ? grant.actor_organization_id : null,
    action: "file.list",
    target_type: "event",
    target_id: eventId,
    animal_id: animalId,
    result: "success",
    reason: accessMode === "own_only" ? "fallback_own_event_files_only" : undefined,
  });

  return NextResponse.json(
    {
      ok: true,
      mode: accessMode,
      files: data ?? [],
    },
    { status: 200 }
  );
}
