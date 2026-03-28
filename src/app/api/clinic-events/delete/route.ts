import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { sendOwnerAnimalUpdateEmail } from "@/lib/email/sendOwnerAnimalUpdateEmail";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";

type Body = { id: string };

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

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: "id invalid" }, { status: 400 });
  }

  const { data: current, error: readErr } = await supabase
    .from("animal_clinic_events")
    .select("*")
    .eq("id", id)
    .single();

  if (readErr || !current) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if ((current as any).status === "void") {
    return NextResponse.json({ ok: true }, { status: 200 });
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
      action: "event.delete",
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
      const reason = "Non autorizzato: puoi eliminare solo eventi owner o i tuoi eventi.";

      await safeWriteAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
        action: "event.delete",
        target_type: "event",
        target_id: id,
        animal_id: animalId,
        result: "denied",
        reason,
      });

      return NextResponse.json({ error: reason }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("animal_clinic_events")
    .update({ status: "void" })
    .eq("id", id);

  if (error) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.delete",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "error",
      reason: error.message,
    });

    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 400 });
  }

  try {
    await supabase.from("animal_clinic_event_audit").insert({
      event_id: (current as any).id,
      animal_id: animalId,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "delete",
      previous_data: current,
      next_data: { ...(current as any), status: "void" },
    });
  } catch (auditInsertError) {
    console.error("[CLINIC_EVENT_AUDIT_INSERT_ERROR]", auditInsertError);
  }

  try {
    const currentTitle =
      typeof (current as any).title === "string" && (current as any).title.trim()
        ? (current as any).title.trim()
        : "Evento clinico annullato";

    const currentDate =
      typeof (current as any).event_date === "string" && (current as any).event_date.trim()
        ? (current as any).event_date.trim()
        : null;

    const currentType =
      typeof (current as any).type === "string" && (current as any).type.trim()
        ? (current as any).type.trim()
        : null;

    const currentDescription =
      typeof (current as any).description === "string" && (current as any).description.trim()
        ? (current as any).description.trim()
        : null;

    const currentPriority =
      typeof (current as any).priority === "string" &&
      ["low", "normal", "high", "urgent"].includes((current as any).priority)
        ? ((current as any).priority as "low" | "normal" | "high" | "urgent")
        : null;

    const currentMeta =
      (current as any).meta && typeof (current as any).meta === "object"
        ? (current as any).meta
        : null;

    const notesParts = [
      "Questo evento clinico è stato annullato.",
      currentType ? `Tipo: ${currentType}` : null,
      currentDescription ? `Note originali: ${currentDescription}` : null,
    ].filter(Boolean);

    await sendOwnerAnimalUpdateEmail({
      animalId,
      action: "deleted",
      eventTitle: `${currentTitle} (annullato)`,
      eventDate: currentDate,
      eventNotes: notesParts.join(" • "),
      eventType: currentType,
      priority: currentPriority,
      meta: currentMeta,
      attachments: null,
    });
  } catch (emailError) {
    console.error("[CLINIC_EVENT_OWNER_EMAIL_DELETE]", emailError);
  }

  await safeWriteAudit(supabase, {
    req,
    actor_user_id: user.id,
    actor_org_id: grant.actor_org_id,
    action: "event.delete",
    target_type: "event",
    target_id: id,
    animal_id: animalId,
    result: "success",
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}