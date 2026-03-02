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
  const animalId = (url.searchParams.get("animalId") || "").trim();
  if (!animalId) return NextResponse.json({ error: "animalId required" }, { status: 400 });

  // ✅ GRANT CHECK (READ)
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

  try {
    // group-by semplice lato app (evitiamo rpc)
    const { data, error } = await supabase
      .from("animal_clinic_event_files")
      .select("event_id")
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
      return NextResponse.json({ error: "Impossibile leggere conteggio allegati." }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const eid = (row as any).event_id as string;
      if (!eid) continue;
      counts[eid] = (counts[eid] ?? 0) + 1;
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
      diff: { eventIds: Object.keys(counts).length },
    });

    return NextResponse.json({ ok: true, counts }, { status: 200 });
  } catch {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "file.count",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "error",
      reason: "Unhandled server error",
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}