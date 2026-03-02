import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const eventId = (url.searchParams.get("eventId") || "").trim();
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  // Ricava animal_id dall'evento
  const { data: ev, error: evErr } = await supabase
    .from("animal_clinic_events")
    .select("id, animal_id")
    .eq("id", eventId)
    .single();

  if (evErr || !ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const animalId = (ev as any).animal_id as string;

  // ✅ GRANT CHECK (READ)
  const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "read");
  if (!grant.ok) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      action: "file.list",
      target_type: "event",
      target_id: eventId,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });
    return NextResponse.json({ error: grant.reason }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("animal_clinic_event_files")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "file.list",
      target_type: "event",
      target_id: eventId,
      animal_id: animalId,
      result: "error",
      reason: error.message,
    });
    return NextResponse.json({ error: error.message || "Query failed" }, { status: 400 });
  }

  await writeAudit(supabase, {
    req,
    actor_user_id: user.id,
    actor_org_id: grant.actor_org_id,
    action: "file.list",
    target_type: "event",
    target_id: eventId,
    animal_id: animalId,
    result: "success",
  });

  return NextResponse.json({ ok: true, files: data ?? [] }, { status: 200 });
}