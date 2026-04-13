import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { requireClinicOperatorSession } from "@/lib/server/requireClinicOperatorSession";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { sendOwnerAnimalUpdateEmail } from "@/lib/email/sendOwnerAnimalUpdateEmail";
import { createClinicalEventOwnerNotification } from "@/lib/notifications/create-owner-notification";
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
  meta?: Record<string, unknown> | null;
};

type EventPriority = "low" | "normal" | "high" | "urgent";

type ClinicEventMeta = Record<string, unknown>;

type AnimalClinicEventRow = {
  id: string;
  animal_id: string;
  source: string | null;
  created_by_user_id: string | null;
  title: string | null;
  type: string | null;
  event_date: string | null;
  description: string | null;
  meta: ClinicEventMeta | null;
  verified_at: string | null;
  verified_by_user_id: string | null;
  verified_by_organization_id: string | null;
  verified_by_member_id: string | null;
  verified_by_label: string | null;
};

type AnimalRow = {
  id: string;
  name: string | null;
  owner_id: string | null;
};

type RequireOwnerOrGrantClient = Parameters<typeof requireOwnerOrGrant>[0];

function isVetUser(user: {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const email = String(user?.email || "").toLowerCase().trim();
  if (email === "valentinotwister@hotmail.it") return true;
  return Boolean(user?.app_metadata?.is_vet || user?.user_metadata?.is_vet);
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function unauthorized(message = "Non autorizzato") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

function isValidDateYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function parseDateOnly(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function sanitizeMeta(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const reservedKeys = new Set([
    "therapy_start_date",
    "therapy_end_date",
    "priority",
    "created_by_member_label",
    "created_by_member_id",
    "created_by_organization_name",
    "has_attachments",
    "weight_kg",
    "active_operator_user_id",
    "active_operator_professional_id",
    "active_operator_label",
    "operator_session_id",
    "signature_mode",
  ]);

  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!key || reservedKeys.has(key)) continue;
    output[key] = value;
  }

  return output;
}

export async function POST(req: Request) {
  const token = getBearerToken(req);

  if (!token) {
    return unauthorized("Token Bearer mancante");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { error: "Server configurato in modo non valido" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;

  if (userErr || !user) {
    return unauthorized();
  }

  const operatorContext = await requireClinicOperatorSession(req, user.id);

  if (!operatorContext.ok) {
    return NextResponse.json(
      { error: operatorContext.reason },
      { status: operatorContext.status }
    );
  }

  const operator = operatorContext.data;

  if (!isVetUser(user)) {
    return forbidden("Cartella clinica riservata ai veterinari autorizzati.");
  }

  const body = (await req.json().catch(() => null)) as Body | null;

  if (!body) {
    return badRequest("Body JSON non valido");
  }

  const id = String(body.id || "").trim();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const eventDate = typeof body.eventDate === "string" ? body.eventDate.trim() : "";
  const description = (body.description ?? "").toString().trim() || null;

  if (!id) {
    return badRequest("id obbligatorio");
  }

  if (!isUuid(id)) {
    return badRequest("id non valido");
  }

  if (!title) {
    return badRequest("title obbligatorio");
  }

  if (!type) {
    return badRequest("type obbligatorio");
  }

  if (!eventDate || !isValidDateYYYYMMDD(eventDate)) {
    return badRequest("eventDate deve essere in formato YYYY-MM-DD");
  }

  if (title.length > 200) {
    return badRequest("title troppo lungo");
  }

  if (type.length > 80) {
    return badRequest("type troppo lungo");
  }

  if (description && description.length > 5000) {
    return badRequest("description troppo lunga");
  }

  const { data: current, error: readErr } = await supabase
    .from("animal_clinic_events")
    .select("*")
    .eq("id", id)
    .single<AnimalClinicEventRow>();

  if (readErr || !current) {
    return NextResponse.json({ error: "Evento non trovato" }, { status: 404 });
  }

  const animalId = String(current.animal_id || "");

  if (!animalId || !isUuid(animalId)) {
    return badRequest("animal_id evento non valido");
  }

  const grant = await requireOwnerOrGrant(
    supabase as RequireOwnerOrGrantClient,
    user.id,
    animalId,
    "write"
  );

  if (!grant.ok) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: operator.activeOperatorUserId,
      actor_organization_id: operator.organizationId,
      action: "event.update",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });

    return forbidden(grant.reason);
  }

  const createdByUserId = current.created_by_user_id ?? null;

  if (!createdByUserId || createdByUserId !== operator.activeOperatorUserId) {
    const reason = "Non autorizzato: puoi modificare solo i tuoi eventi clinici.";

    await safeWriteAudit(supabase, {
      req,
      actor_user_id: operator.activeOperatorUserId,
      actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
      action: "event.update",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "denied",
      reason,
    });

    return forbidden(reason);
  }

  const therapyStartDate = parseDateOnly(body.therapyStartDate);
  const therapyEndDate = parseDateOnly(body.therapyEndDate);

  if (
    therapyStartDate &&
    therapyEndDate &&
    new Date(`${therapyEndDate}T00:00:00.000Z`).getTime() <
      new Date(`${therapyStartDate}T00:00:00.000Z`).getTime()
  ) {
    return badRequest("therapyEndDate non può essere precedente a therapyStartDate");
  }

  const priority: EventPriority | null =
    body.priority === "low" ||
    body.priority === "normal" ||
    body.priority === "high" ||
    body.priority === "urgent"
      ? body.priority
      : null;

  const nextMeta: ClinicEventMeta = {
    ...((current.meta || {}) as ClinicEventMeta),
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

  nextMeta.active_operator_user_id = operator.activeOperatorUserId;
  nextMeta.active_operator_professional_id = operator.activeOperatorProfessionalId;
  nextMeta.active_operator_label = operator.activeOperatorLabel;
  nextMeta.operator_session_id = operator.operatorSessionId;
  nextMeta.signature_mode = "operator_session_pin";
  nextMeta.updated_by_member_id = operator.activeOperatorUserId;
  nextMeta.updated_by_member_label = operator.activeOperatorLabel;

  const before = {
    title: current.title,
    type: current.type,
    event_date: current.event_date,
    description: current.description,
    meta: current.meta,
    verified_at: current.verified_at,
    verified_by_user_id: current.verified_by_user_id,
    verified_by_organization_id: current.verified_by_organization_id,
    verified_by_member_id: current.verified_by_member_id,
    verified_by_label: current.verified_by_label,
  };

  const updateData: {
    title: string;
    type: string;
    event_date: string;
    description: string | null;
    meta: ClinicEventMeta;
    verified_at?: null;
    verified_by_user_id?: null;
    verified_by_organization_id?: null;
    verified_by_member_id?: null;
    verified_by_label?: null;
  } = {
    title,
    type,
    event_date: eventDate,
    description,
    meta: nextMeta,
  };

  if (
    current.verified_at ||
    current.source === "professional" ||
    current.source === "veterinarian"
  ) {
    updateData.verified_at = null;
    updateData.verified_by_user_id = null;
    updateData.verified_by_organization_id = null;
    updateData.verified_by_member_id = null;
    updateData.verified_by_label = null;
  }

  const { data: updated, error } = await supabase
    .from("animal_clinic_events")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single<AnimalClinicEventRow>();

  if (error || !updated) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: operator.activeOperatorUserId,
      actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
      action: "event.update",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "error",
      reason: error?.message || "update failed",
    });

    return badRequest(error?.message || "Aggiornamento evento non riuscito");
  }

  try {
    await supabase.from("animal_clinic_event_audit").insert({
      event_id: current.id,
      animal_id: animalId,
      actor_user_id: operator.activeOperatorUserId,
      actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
      actor_member_id: operator.activeOperatorUserId,
      action: "update",
      previous_data: current,
      next_data: { ...current, ...updateData },
    });
  } catch (auditInsertError) {
    console.error("[CLINIC_EVENT_AUDIT_INSERT_ERROR]", auditInsertError);
  }

  try {
    const { data: animalRow } = await supabase
      .from("animals")
      .select("id, name, owner_id")
      .eq("id", animalId)
      .maybeSingle<AnimalRow>();

    if (animalRow?.owner_id) {
      await createClinicalEventOwnerNotification({
        ownerId: animalRow.owner_id,
        animalId: animalRow.id,
        animalName: animalRow.name ?? "Animale",
        eventType: `${type || "Evento clinico"} aggiornato`,
        shortDescription: description || title || "Un evento clinico è stato aggiornato",
      });
    }
  } catch (notificationError) {
    console.error("[OWNER_NOTIFICATION_UPDATE_ERROR]", notificationError);
  }

  try {
    await sendOwnerAnimalUpdateEmail({
      animalId,
      action: "updated",
      eventTitle: title || "Evento clinico aggiornato",
      eventDate: eventDate || null,
      eventNotes: description || null,
      eventType: type || null,
      priority,
      therapyStartDate: therapyStartDate ?? null,
      therapyEndDate: therapyEndDate ?? null,
      meta: nextMeta ?? null,
      attachments: null,
    });
  } catch (emailError) {
    console.error("[CLINIC_EVENT_OWNER_EMAIL_UPDATE]", emailError);
  }

  const after = {
    title: updated.title,
    type: updated.type,
    event_date: updated.event_date,
    description: updated.description,
    meta: updated.meta,
    verified_at: updated.verified_at,
    verified_by_user_id: updated.verified_by_user_id,
    verified_by_organization_id: updated.verified_by_organization_id,
    verified_by_member_id: updated.verified_by_member_id,
    verified_by_label: updated.verified_by_label,
  };

  await safeWriteAudit(supabase, {
    req,
    actor_user_id: operator.activeOperatorUserId,
    actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
    action: "event.update",
    target_type: "event",
    target_id: id,
    animal_id: animalId,
    result: "success",
    diff: { before, after },
  });

  return NextResponse.json({ ok: true, event: updated }, { status: 200 });
}