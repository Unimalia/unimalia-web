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

type Body = {
  id: string;
  title?: string;
  type?: string;
  eventDate?: string;
  description?: string | null;
  therapyStartDate?: string | null;
  therapyEndDate?: string | null;
  priority?: "low" | "normal" | "high" | "urgent" | null;
  meta?: Record<string, any> | null;
};

function isValidDateYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function parseDateOnly(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

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

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const id = (body.id || "").trim();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const eventDate = typeof body.eventDate === "string" ? body.eventDate.trim() : "";
  const description = (body.description ?? "").toString().trim() || null;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (!isUuid(id)) {
    return NextResponse.json({ error: "id invalid" }, { status: 400 });
  }

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

  const therapyStartDate = parseDateOnly((body as any).therapyStartDate);
  const therapyEndDate = parseDateOnly((body as any).therapyEndDate);
  const priority =
    ["low", "normal", "high", "urgent"].includes(String((body as any).priority || ""))
      ? String((body as any).priority)
      : null;

  const nextMeta: Record<string, any> = {
    ...(((current as any).meta as Record<string, any>) || {}),
  };

  const incomingMeta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? body.meta
      : null;

  if (incomingMeta) {
    Object.assign(nextMeta, incomingMeta);
  }

  if (type === "therapy") {
    if (therapyStartDate) nextMeta.therapy_start_date = therapyStartDate;
    nextMeta.therapy_end_date = therapyEndDate || null;
  } else {
    delete nextMeta.therapy_start_date;
    delete nextMeta.therapy_end_date;
  }

  if (priority) nextMeta.priority = priority;

  const before = {
    title: (current as any).title,
    type: (current as any).type,
    event_date: (current as any).event_date,
    description: (current as any).description,
    meta: (current as any).meta,
  };

  const updateData: Record<string, any> = {
    title,
    type,
    event_date: eventDate,
    description,
    meta: nextMeta,
  };

  if ((current as any).verified_at || (current as any).source === "professional") {
    updateData.verified_at = null;
    updateData.verified_by = null;
  }

  const { data: updated, error } = await supabase
    .from("animal_clinic_events")
    .update(updateData)
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

  await supabase.from("animal_clinic_event_audit").insert({
    event_id: (current as any).id,
    animal_id: animalId,
    actor_user_id: user.id,
    actor_org_id: grant.actor_org_id,
    action: "update",
    previous_data: current,
    next_data: { ...current, ...updateData },
  });

  const after = {
    title: (updated as any).title,
    type: (updated as any).type,
    event_date: (updated as any).event_date,
    description: (updated as any).description,
    meta: (updated as any).meta,
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