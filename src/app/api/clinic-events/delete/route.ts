import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { requireClinicOperatorSession } from "@/lib/server/requireClinicOperatorSession";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { sendOwnerAnimalUpdateEmail } from "@/lib/email/sendOwnerAnimalUpdateEmail";
import { createClinicalEventOwnerNotification } from "@/lib/notifications/create-owner-notification";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";

type Body = { id: string };

type EventPriority = "low" | "normal" | "high" | "urgent";

type ClinicEventMeta = Record<string, unknown>;

type AnimalClinicEventRow = {
  id: string;
  animal_id: string;
  status: string | null;
  source: string | null;
  created_by_user_id: string | null;
  title: string | null;
  event_date: string | null;
  type: string | null;
  description: string | null;
  priority: string | null;
  meta: ClinicEventMeta | null;
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

  const body = (await req.json().catch(() => null)) as Body | null;

  if (!body) {
    return badRequest("Body JSON non valido");
  }

  const id = String(body.id || "").trim();

  if (!id) {
    return badRequest("id obbligatorio");
  }

  if (!isUuid(id)) {
    return badRequest("id non valido");
  }

  const { data: current, error: readErr } = await supabase
    .from("animal_clinic_events")
    .select("*")
    .eq("id", id)
    .single<AnimalClinicEventRow>();

  if (readErr || !current) {
    return NextResponse.json({ error: "Evento non trovato" }, { status: 404 });
  }

  if (current.status === "void") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const animalId = String(current.animal_id || "");

  if (!animalId || !isUuid(animalId)) {
    return badRequest("animal_id evento non valido");
  }

  if (!isVetUser(user)) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: operator.activeOperatorUserId,
      actor_organization_id: operator.organizationId,
      action: "event.delete",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "denied",
      reason: "Cartella clinica riservata ai veterinari.",
    });

    return forbidden("Cartella clinica riservata ai veterinari autorizzati.");
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
      action: "event.delete",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });

    return forbidden(grant.reason);
  }

  const { error } = await supabase
    .from("animal_clinic_events")
    .update({ status: "void" })
    .eq("id", id);

  if (error) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: operator.activeOperatorUserId,
      actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
      action: "event.delete",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "error",
      reason: error.message,
    });

    return badRequest(error.message || "Eliminazione evento non riuscita");
  }

  try {
    await supabase.from("animal_clinic_event_audit").insert({
      event_id: current.id,
      animal_id: animalId,
      actor_user_id: operator.activeOperatorUserId,
      actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
      actor_member_id: operator.activeOperatorUserId,
      action: "delete",
      previous_data: current,
      next_data: { ...current, status: "void" },
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
        eventType: `${current.type || "Evento clinico"} annullato`,
        shortDescription:
          current.description ||
          current.title ||
          "Un evento clinico è stato annullato",
      });
    }
  } catch (notificationError) {
    console.error("[OWNER_NOTIFICATION_DELETE_ERROR]", notificationError);
  }

  try {
    const currentTitle =
      typeof current.title === "string" && current.title.trim()
        ? current.title.trim()
        : "Evento clinico annullato";

    const currentDate =
      typeof current.event_date === "string" && current.event_date.trim()
        ? current.event_date.trim()
        : null;

    const currentType =
      typeof current.type === "string" && current.type.trim()
        ? current.type.trim()
        : null;

    const currentDescription =
      typeof current.description === "string" && current.description.trim()
        ? current.description.trim()
        : null;

    const currentPriority: EventPriority | null =
      current.priority === "low" ||
      current.priority === "normal" ||
      current.priority === "high" ||
      current.priority === "urgent"
        ? current.priority
        : null;

    const currentMeta =
      current.meta && typeof current.meta === "object" ? current.meta : null;

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
    actor_user_id: operator.activeOperatorUserId,
    actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
    action: "event.delete",
    target_type: "event",
    target_id: id,
    animal_id: animalId,
    result: "success",
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}