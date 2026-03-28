import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { sendOwnerAnimalUpdateEmail } from "@/lib/email/sendOwnerAnimalUpdateEmail";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";

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

function sanitizeMeta(input: unknown): Record<string, any> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const reservedKeys = new Set([
    "therapy_start_date",
    "therapy_end_date",
    "priority",
    "created_by_member_label",
    "created_by_member_id",
    "created_by_org_name",
    "has_attachments",
    "weight_kg",
  ]);

  const output: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!key || reservedKeys.has(key)) continue;
    output[key] = value;
  }

  return output;
}

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

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = String(body.id || "").trim();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const eventDate = typeof body.eventDate === "string" ? body.eventDate.trim() : "";
  const description = (body.description ?? "").toString().trim() || null;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: "id invalid" }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  if (!type) {
    return NextResponse.json({ error: "type required" }, { status: 400 });
  }

  if (!eventDate || !isValidDateYYYYMMDD(eventDate)) {
    return NextResponse.json({ error: "eventDate must be YYYY-MM-DD" }, { status: 400 });
  }

  if (title.length > 200) {
    return NextResponse.json({ error: "title too long" }, { status: 400 });
  }

  if (type.length > 80) {
    return NextResponse.json({ error: "type too long" }, { status: 400 });
  }

  if (description && description.length > 5000) {
    return NextResponse.json({ error: "description too long" }, { status: 400 });
  }

  const { data: current, error: readErr } = await supabase
    .from("animal_clinic_events")
    .select("*")
    .eq("id", id)
    .single();

  if (readErr || !current) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const animalId = String((current as any).animal_id || "");

  if (!animalId || !isUuid(animalId)) {
    return NextResponse.json({ error: "Invalid event animal_id" }, { status: 400 });
  }

  const grant = await requireOwnerOrGrant(supabase as any, user.id, animalId, "write");

  if (!grant.ok) {
    await safeWriteAudit(supabase, {
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

  const source = String((current as any).source || "");
  const createdBy = ((current as any).created_by as string | null) ?? null;

  if (source !== "owner") {
    if (!createdBy || createdBy !== user.id) {
      const reason = "Non autorizzato: puoi modificare solo eventi owner o i tuoi eventi.";

      await safeWriteAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
        action: "event.update",
        target_type: "event",
        target_id: id,
        animal_id: animalId,
        result: "denied",
        reason,
      });

      return NextResponse.json({ error: reason }, { status: 403 });
    }
  }

  const therapyStartDate = parseDateOnly(body.therapyStartDate);
  const therapyEndDate = parseDateOnly(body.therapyEndDate);

  if (
    therapyStartDate &&
    therapyEndDate &&
    new Date(`${therapyEndDate}T00:00:00.000Z`).getTime() <
      new Date(`${therapyStartDate}T00:00:00.000Z`).getTime()
  ) {
    return NextResponse.json(
      { error: "therapyEndDate cannot be before therapyStartDate" },
      { status: 400 }
    );
  }

  const priority =
    ["low", "normal", "high", "urgent"].includes(String(body.priority || ""))
      ? String(body.priority)
      : null;

  const nextMeta: Record<string, any> = {
    ...((((current as any).meta as Record<string, any>) || {}) as Record<string, any>),
  };

  const incomingMeta = sanitizeMeta(body.meta);

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

  if (priority) {
    nextMeta.priority = priority;
  } else {
    delete nextMeta.priority;
  }

  const before = {
    title: (current as any).title,
    type: (current as any).type,
    event_date: (current as any).event_date,
    description: (current as any).description,
    meta: (current as any).meta,
    verified_at: (current as any).verified_at,
    verified_by: (current as any).verified_by,
    verified_by_org_id: (current as any).verified_by_org_id,
    verified_by_member_id: (current as any).verified_by_member_id,
    verified_by_label: (current as any).verified_by_label,
  };

  const updateData: Record<string, any> = {
    title,
    type,
    event_date: eventDate,
    description,
    meta: nextMeta,
  };

  if ((current as any).verified_at || source === "professional" || source === "veterinarian") {
    updateData.verified_at = null;
    updateData.verified_by = null;
    updateData.verified_by_org_id = null;
    updateData.verified_by_member_id = null;
    updateData.verified_by_label = null;
  }

  const { data: updated, error } = await supabase
    .from("animal_clinic_events")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !updated) {
    await safeWriteAudit(supabase, {
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

  try {
    await supabase.from("animal_clinic_event_audit").insert({
      event_id: (current as any).id,
      animal_id: animalId,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "update",
      previous_data: current,
      next_data: { ...current, ...updateData },
    });
  } catch (auditInsertError) {
    console.error("[CLINIC_EVENT_AUDIT_INSERT_ERROR]", auditInsertError);
  }

  try {
    await sendOwnerAnimalUpdateEmail({
      animalId,
      action: "updated",
      eventTitle: title || "Evento clinico aggiornato",
      eventDate: eventDate || null,
      eventNotes: description || null,
      eventType: type || null,
      priority:
        priority === "low" ||
        priority === "normal" ||
        priority === "high" ||
        priority === "urgent"
          ? priority
          : null,
      therapyStartDate: therapyStartDate ?? null,
      therapyEndDate: therapyEndDate ?? null,
      meta: nextMeta ?? null,
      attachments: null,
    });
  } catch (emailError) {
    console.error("[CLINIC_EVENT_OWNER_EMAIL_UPDATE]", emailError);
  }

  const after = {
    title: (updated as any).title,
    type: (updated as any).type,
    event_date: (updated as any).event_date,
    description: (updated as any).description,
    meta: (updated as any).meta,
    verified_at: (updated as any).verified_at,
    verified_by: (updated as any).verified_by,
    verified_by_org_id: (updated as any).verified_by_org_id,
    verified_by_member_id: (updated as any).verified_by_member_id,
    verified_by_label: (updated as any).verified_by_label,
  };

  await safeWriteAudit(supabase, {
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