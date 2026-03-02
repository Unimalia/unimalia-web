import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

type Body = {
  id: string;
  title: string;
  type: string;
  eventDate: string; // YYYY-MM-DD
  description?: string | null;
};

function isValidDateYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function POST(req: Request) {
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

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const id = (body.id || "").trim();
  const title = (body.title || "").trim();
  const type = (body.type || "").trim();
  const eventDate = (body.eventDate || "").trim();
  const description = (body.description ?? "").toString().trim() || null;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });
  if (!eventDate || !isValidDateYYYYMMDD(eventDate)) {
    return NextResponse.json({ error: "eventDate must be YYYY-MM-DD" }, { status: 400 });
  }

  // read current
  const { data: current, error: readErr } = await supabase
    .from("animal_clinic_events")
    .select("*")
    .eq("id", id)
    .single();

  if (readErr || !current) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const animalId = (current as any).animal_id as string;

  // ✅ GRANT CHECK (WRITE)
  const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "write");
  if (!grant.ok) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      action: "event.update",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });
    return NextResponse.json({ error: grant.reason }, { status: 403 });
  }

  // regola X non modifica Y: pro può modificare owner + i propri (created_by)
  const source = (current as any).source as string;
  const createdBy = ((current as any).created_by as string | null) ?? null;

  if (source !== "owner") {
    if (!createdBy || createdBy !== user.id) {
      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
        action: "event.update",
        target_type: "event",
        target_id: id,
        animal_id: animalId,
        result: "denied",
        reason: "Non autorizzato: puoi modificare solo eventi owner o i tuoi eventi.",
      });
      return NextResponse.json(
        { error: "Non autorizzato: puoi modificare solo eventi owner o i tuoi eventi." },
        { status: 403 }
      );
    }
  }

  const before = {
    title: (current as any).title,
    type: (current as any).type,
    event_date: (current as any).event_date,
    description: (current as any).description,
  };

  const { data: updated, error } = await supabase
    .from("animal_clinic_events")
    .update({
      title,
      type,
      event_date: eventDate,
      description,
      // owner che modifica dopo validazione → torna da validare (semplice e difendibile)
      verified_at: source === "owner" ? null : (current as any).verified_at,
      verified_by: source === "owner" ? null : (current as any).verified_by,
      verified_by_org_id: source === "owner" ? null : (current as any).verified_by_org_id,
      verified_by_member_id: source === "owner" ? null : (current as any).verified_by_member_id,
      verified_by_label: source === "owner" ? null : (current as any).verified_by_label,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !updated) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.update",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "error",
      reason: error?.message || "update failed",
    });
    return NextResponse.json({ error: error?.message || "Update failed" }, { status: 400 });
  }

  const after = {
    title: (updated as any).title,
    type: (updated as any).type,
    event_date: (updated as any).event_date,
    description: (updated as any).description,
  };

  await writeAudit(supabase, {
    req,
    actor_user_id: user.id,
    actor_org_id: grant.actor_org_id,
    action: "event.update",
    target_type: "event",
    target_id: id,
    animal_id: animalId,
    result: "success",
    diff: { before, after },
  });

  return NextResponse.json({ ok: true, event: updated }, { status: 200 });
}