import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { requireClinicOperatorSession } from "@/lib/server/requireClinicOperatorSession";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendOwnerAnimalUpdateEmail } from "@/lib/email/sendOwnerAnimalUpdateEmail";
import { createClinicalEventOwnerNotification } from "@/lib/notifications/create-owner-notification";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";

type Body = {
  animalId: string;
  type: string;
  title: string;
  description?: string | null;
  visibility?: "owner" | "professionals" | "emergency";
  eventDate?: string;
  source?: "owner" | "professional" | "veterinarian";
  weightKg?: number | null;
  therapyStartDate?: string | null;
  therapyEndDate?: string | null;
  vetSignature?: string | null;
  vetSignatureMemberId?: string | null;
  priority?: "low" | "normal" | "high" | "urgent" | null;
  meta?: Record<string, unknown> | null;
  reminderEnabled?: boolean;
  remindAt?: string | null;
  remindEmail?: boolean;
  hasAttachments?: boolean;
};

type EventPriority = "low" | "normal" | "high" | "urgent";

type ClinicEventMeta = Record<string, unknown>;

type AnimalClinicEventRow = {
  id: string;
  animal_id: string;
  event_date: string;
  type: string;
  title: string;
  description: string | null;
  visibility: "owner" | "professionals" | "emergency" | string;
  source: "owner" | "professional" | "veterinarian" | string;
  verified_at: string | null;
  verified_by_user_id: string | null;
  verified_by_organization_id: string | null;
  verified_by_member_id: string | null;
  verified_by_label: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  meta: ClinicEventMeta | null;
  priority: EventPriority | null;
};

type OrganizationRow = {
  id: string;
  name: string | null;
  display_name: string | null;
  ragione_sociale: string | null;
};

type ProfessionalRow = {
  display_name: string | null;
  business_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type AnimalRow = {
  id: string;
  name: string | null;
  owner_id: string | null;
  pending_owner_email: string | null;
};

type AnimalReminderRow = {
  owner_id: string | null;
  pending_owner_email: string | null;
  name: string | null;
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

function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
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

function parseWeightKg(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;

  if (typeof v === "number") {
    if (!Number.isFinite(v) || v <= 0) return null;
    return Math.round(v * 10) / 10;
  }

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const n = Number(s.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 10) / 10;
  }

  return null;
}

function sanitizeMeta(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const reservedKeys = new Set([
    "weight_kg",
    "therapy_start_date",
    "therapy_end_date",
    "created_by_member_label",
    "created_by_member_id",
    "created_by_organization_name",
    "has_attachments",
    "priority",
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
    return serverError("Server configurato in modo non valido");
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const admin = supabaseAdmin();

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

  const animalId = String(body.animalId || "").trim();

  if (!animalId) {
    return badRequest("animalId obbligatorio");
  }

  if (!isUuid(animalId)) {
    return badRequest("animalId non valido");
  }

  if (!isVetUser(user)) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: operator.activeOperatorUserId,
      actor_organization_id: operator.organizationId,
      action: "event.create",
      target_type: "animal",
      target_id: animalId,
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
      action: "event.create",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });

    return forbidden(grant.reason);
  }

  const type = String(body.type || "").trim();
  const title = String(body.title || "").trim();
  const description = (body.description ?? "").toString().trim() || null;

  const visibility =
    body.visibility === "owner" ||
    body.visibility === "professionals" ||
    body.visibility === "emergency"
      ? body.visibility
      : "professionals";

  const source: "veterinarian" = "veterinarian";

  if (!type) {
    return badRequest("type obbligatorio");
  }

  if (!title) {
    return badRequest("title obbligatorio");
  }

  if (type.length > 80) {
    return badRequest("type troppo lungo");
  }

  if (title.length > 200) {
    return badRequest("title troppo lungo");
  }

  if (description && description.length > 5000) {
    return badRequest("description troppo lunga");
  }

  const dateStr = String(body.eventDate || "").trim();

  if (!dateStr || !isValidDateYYYYMMDD(dateStr)) {
    return badRequest("eventDate deve essere in formato YYYY-MM-DD");
  }

  const hasAttachments = body.hasAttachments === true;
  const weightKg = parseWeightKg(body.weightKg);
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

  let actorOrgName: string | null = null;

  if (grant.actor_organization_id) {
    const { data: orgRow } = await admin
      .from("organizations")
      .select("id,name,display_name,ragione_sociale")
      .eq("id", grant.actor_organization_id)
      .maybeSingle<OrganizationRow>();

    actorOrgName =
      orgRow?.display_name?.trim() ||
      orgRow?.name?.trim() ||
      orgRow?.ragione_sociale?.trim() ||
      null;
  }

  if (!actorOrgName) {
    const { data: professionalRow } = await admin
      .from("professionals")
      .select("display_name,business_name,first_name,last_name")
      .eq("owner_id", operator.activeOperatorUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<ProfessionalRow>();

    actorOrgName =
      professionalRow?.business_name?.trim() ||
      professionalRow?.display_name?.trim() ||
      [professionalRow?.first_name, professionalRow?.last_name].filter(Boolean).join(" ").trim() ||
      null;
  }

  const meta: ClinicEventMeta = {};
  const incomingMeta = sanitizeMeta(body.meta);

  if (incomingMeta) {
    Object.assign(meta, incomingMeta);
  }

  if (weightKg) meta.weight_kg = weightKg;

  meta.created_by_member_id = operator.activeClinicOperatorId;
  meta.created_by_member_label = operator.activeOperatorLabel;
  meta.active_operator_user_id = operator.activeOperatorUserId;
  meta.active_operator_professional_id = operator.activeOperatorProfessionalId;
  meta.active_operator_label = operator.activeOperatorLabel;
  meta.operator_session_id = operator.operatorSessionId;
  meta.signature_mode = "operator_session_pin";

  if (priority) meta.priority = priority;
  if (actorOrgName) meta.created_by_organization_name = actorOrgName;
  if (hasAttachments) meta.has_attachments = true;

  if (type === "therapy") {
    if (therapyStartDate) meta.therapy_start_date = therapyStartDate;
    meta.therapy_end_date = therapyEndDate || null;
  }

  try {
    const nowIso = new Date().toISOString();
    const verifiedByOrganizationId = grant.actor_organization_id ?? null;

    const { data, error } = await admin
      .from("animal_clinic_events")
      .insert({
        animal_id: animalId,
        type,
        title,
        description,
        visibility,
        source,
        created_by_user_id: operator.activeOperatorUserId,
        event_date: dateStr,
        verified_at: nowIso,
        verified_by_user_id: operator.activeOperatorUserId,
        verified_by_organization_id: verifiedByOrganizationId,
        verified_by_member_id: operator.activeOperatorUserId,
        verified_by_label: operator.activeOperatorLabel,
        meta,
        priority: priority || null,
        status: "active",
      })
      .select(
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by_user_id, verified_by_organization_id, verified_by_member_id, verified_by_label, created_by_user_id, created_at, updated_at, status, meta, priority"
      )
      .single<AnimalClinicEventRow>();

    if (error || !data) {
      await safeWriteAudit(supabase, {
        req,
        actor_user_id: operator.activeOperatorUserId,
        actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
        action: "event.create",
        target_type: "animal",
        target_id: animalId,
        animal_id: animalId,
        result: "error",
        reason: error?.message || "insert failed",
      });

      return badRequest(error?.message || "Creazione evento non riuscita");
    }

    try {
      await admin.from("animal_clinic_event_audit").insert({
        event_id: data.id,
        animal_id: animalId,
        actor_user_id: operator.activeOperatorUserId,
        actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
        actor_member_id: operator.activeClinicOperatorId,
        action: "create",
        previous_data: null,
        next_data: data,
      });
    } catch (auditInsertError) {
      console.error("[CLINIC_EVENT_AUDIT_INSERT_ERROR]", auditInsertError);
    }

    let animalRow: AnimalRow | null = null;

    try {
      const animalFetch = await admin
        .from("animals")
        .select("id, name, owner_id, pending_owner_email")
        .eq("id", animalId)
        .single<AnimalRow>();

      if (animalFetch.error) {
        console.error("[OWNER_NOTIFICATION_ANIMAL_FETCH_ERROR]", animalFetch.error);
      } else {
        animalRow = animalFetch.data;
      }
    } catch (animalReadError) {
      console.error("[OWNER_NOTIFICATION_ANIMAL_FETCH_ERROR]", animalReadError);
    }

    try {
      if (animalRow?.owner_id) {
        await createClinicalEventOwnerNotification({
          ownerId: animalRow.owner_id,
          animalId: animalRow.id,
          animalName: animalRow.name ?? "Animale",
          eventType: type || "Evento clinico",
          shortDescription: description || null,
        });
      }
    } catch (notificationError) {
      console.error("[OWNER_NOTIFICATION_CREATE_ERROR]", notificationError);
    }

    try {
      if (!hasAttachments) {
        await sendOwnerAnimalUpdateEmail({
          animalId,
          eventTitle: title || "Nuovo evento clinico",
          eventDate: dateStr || null,
          eventNotes: description || null,
          action: "created",
          eventType: type || null,
          visibility,
          source,
          priority,
          weightKg,
          therapyStartDate,
          therapyEndDate,
          vetSignature: operator.activeOperatorLabel,
          meta,
          attachments: null,
        });
      }
    } catch (emailError) {
      console.error("[CLINIC_EVENT_OWNER_EMAIL_CREATE]", emailError);
    }

    if (type === "vaccine" && body.reminderEnabled && body.remindEmail !== false) {
      try {
        const { data: animalReminderRow } = await admin
          .from("animals")
          .select("owner_id, pending_owner_email, name")
          .eq("id", animalId)
          .single<AnimalReminderRow>();

        const ownerId = animalReminderRow?.owner_id ?? null;
        const pendingOwnerEmail = animalReminderRow?.pending_owner_email?.trim() || null;
        const animalName = animalReminderRow?.name || "il tuo animale";

        let ownerEmail: string | null = null;

        if (ownerId) {
          const authResp = await admin.auth.admin.getUserById(ownerId);
          ownerEmail = authResp?.data?.user?.email ?? null;
        }

        if (!ownerEmail && pendingOwnerEmail) {
          ownerEmail = pendingOwnerEmail;
        }

        const nextDueDate =
          typeof meta.next_due_date === "string" && meta.next_due_date.trim()
            ? meta.next_due_date.trim()
            : null;

        const remindAt =
          typeof body.remindAt === "string" && body.remindAt.trim() ? body.remindAt.trim() : null;

        const isValidYmd = (v: string | null) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

        if (ownerEmail && isValidYmd(nextDueDate) && isValidYmd(remindAt)) {
          const due = new Date(`${nextDueDate}T00:00:00.000Z`);
          const remind = new Date(`${remindAt}T00:00:00.000Z`);
          const diffMs = due.getTime() - remind.getTime();
          const diffDays = Math.max(0, Math.round(diffMs / 86400000));

          await admin.from("animal_reminders").insert({
            animal_id: animalId,
            kind: "vaccine",
            title: `Promemoria vaccino per ${animalName}`,
            due_date: nextDueDate,
            remind_days_before: diffDays,
            recipient_email: ownerEmail,
            status: "scheduled",
          });
        }
      } catch (reminderError) {
        console.error("[AUTOMATIC_VACCINE_REMINDER_CREATE_ERROR]", reminderError);
      }
    }

    await safeWriteAudit(supabase, {
      req,
      actor_user_id: operator.activeOperatorUserId,
      actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
      action: "event.create",
      target_type: "event",
      target_id: data.id,
      animal_id: animalId,
      result: "success",
    });

    return NextResponse.json({ ok: true, event: data }, { status: 200 });
  } catch (error: unknown) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: operator.activeOperatorUserId,
      actor_organization_id: grant.actor_organization_id ?? operator.organizationId,
      action: "event.create",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "error",
      reason: error instanceof Error ? error.message : "Unhandled server error",
    });

    return serverError("Errore interno del server");
  }
}