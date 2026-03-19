import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
  if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

  const url = new URL(req.url);
  const animalId = String(url.searchParams.get("animalId") ?? "").trim();

  if (!animalId) {
    return NextResponse.json({ error: "animalId required" }, { status: 400 });
  }

  if (!isUuid(animalId)) {
    return NextResponse.json({ error: "animalId invalid" }, { status: 400 });
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

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "read");
  if (!grant.ok) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      action: "file.count",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });
    return NextResponse.json({ error: grant.reason }, { status: 403 });
  }

  const { data: files, error } = await supabase
    .from("animal_clinic_event_files")
    .select("id, event_id, animal_id")
    .eq("animal_id", animalId);

  if (error) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "file.count",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "error",
      reason: error.message,
    });
    return NextResponse.json({ error: error.message || "Count failed" }, { status: 400 });
  }

  const counts: Record<string, number> = {};

  for (const file of files ?? []) {
    const eventId = String((file as any).event_id || "");
    if (!eventId) continue;
    counts[eventId] = (counts[eventId] ?? 0) + 1;
  }

  await writeAudit(supabase, {
    req,
    actor_user_id: user.id,
    actor_org_id: grant.actor_org_id,
    action: "file.count",
    target_type: "animal",
    target_id: animalId,
    animal_id: animalId,
    result: "success",
  });

  return NextResponse.json({ ok: true, counts }, { status: 200 });
}