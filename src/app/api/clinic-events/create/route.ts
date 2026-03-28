import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
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
  meta?: Record<string, any> | null;
  reminderEnabled?: boolean;
  remindAt?: string | null;
  remindEmail?: boolean;
  hasAttachments?: boolean;
};

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

function sanitizeMeta(input: unknown): Record<string, any> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const reservedKeys = new Set([
    "weight_kg",
    "therapy_start_date",
    "therapy_end_date",
    "created_by_member_label",
    "created_by_member_id",
    "created_by_org_name",
    "has_attachments",
    "priority",
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

  const grant = await requireOwnerOrGrant(supabase as any, user.id, animalId, "write");

  if (!grant.ok) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: null,
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

  let source: "owner" | "professional" | "veterinarian" =
    body.source === "owner" || body.source === "professional" || body.source === "veterinarian"
      ? body.source
      : "professional";

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

  const vetSignature =
    typeof body.vetSignature === "string" ? body.vetSignature.trim() || null : null;

  const priority =
    ["low", "normal", "high", "urgent"].includes(String(body.priority || ""))
      ? String(body.priority)
      : null;

  let actorOrgName: string | null = null;

  if (grant.actor_org_id) {
    const { data: orgRow } = await admin
      .from("organizations")
      .select("id,name,display_name,ragione_sociale")
      .eq("id", grant.actor_org_id)
      .maybeSingle();

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
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    actorOrgName =
      professionalRow?.business_name?.trim() ||
      professionalRow?.display_name?.trim() ||
      [professionalRow?.first_name, professionalRow?.last_name].filter(Boolean).join(" ").trim() ||
      null;
  }

  if (source === "veterinarian" && !grant.actor_org_id) {
    source = "professional";
  }

  const meta: Record<string, any> = {};
  const incomingMeta = sanitizeMeta(body.meta);

  if (incomingMeta) {
    Object.assign(meta, incomingMeta);
  }

  if (weightKg) meta.weight_kg = weightKg;

  // 🔒 FIRMA SICURA
  meta.created_by_member_id = user.id;
  meta.created_by_member_label =
    vetSignature && vetSignature.length <= 120
      ? vetSignature
      : user.email || "Veterinario";

  if (priority) meta.priority = priority;
  if (actorOrgName) meta.created_by_org_name = actorOrgName;
  if (hasAttachments) meta.has_attachments = true;

  if (type === "therapy") {
    if (therapyStartDate) meta.therapy_start_date = therapyStartDate;
    meta.therapy_end_date = therapyEndDate || null;
  }

  try {
    const nowIso = new Date().toISOString();
    const verifiedByOrgId =
      source === "veterinarian" && grant.actor_org_id ? grant.actor_org_id : null;

    const { data, error } = await admin
      .from("animal_clinic_events")
      .insert({
        animal_id: animalId,
        type,
        title,
        description,
        visibility,
        source,
        created_by: user.id,
        event_date: dateStr,
        verified_at: source === "veterinarian" ? nowIso : null,
        verified_by: source === "veterinarian" ? user.id : null,
        verified_by_org_id: verifiedByOrgId,
        verified_by_member_id: source === "veterinarian" ? user.id : null,
        verified_by_label: source === "veterinarian" ? (user.email || "Veterinario") : null,
        meta,
        priority: priority || null,
        status: "active",
      })
      .select(
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by, verified_by_org_id, verified_by_member_id, verified_by_label, created_by, created_at, updated_at, status, meta"
      )
      .single();

    if (error || !data) {
      await safeWriteAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
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
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
        actor_member_id: user.id,
        action: "create",
        previous_data: null,
        next_data: data,
      });
    } catch (auditInsertError) {
      console.error("[CLINIC_EVENT_AUDIT_INSERT_ERROR]", auditInsertError);
    }

    let animalRow:
      | {
          id: string;
          name: string | null;
          owner_id: string | null;
          pending_owner_email: string | null;
        }
      | null = null;

    try {
      const animalFetch = await admin
        .from("animals")
        .select("id, name, owner_id, pending_owner_email")
        .eq("id", animalId)
        .single();

      if (animalFetch.error) {
        console.error("[OWNER_NOTIFICATION_ANIMAL_FETCH_ERROR]", animalFetch.error);
      } else {
        animalRow = animalFetch.data;
      }
    } catch (animalReadError) {
      console.error("[OWNER_NOTIFICATION_ANIMAL_FETCH_ERROR]", animalReadError);
    }

    try {
      if (animalRow?.owner_id && source !== "owner") {
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
      if (source !== "owner" && !hasAttachments) {
        await sendOwnerAnimalUpdateEmail({
          animalId,
          eventTitle: title || "Nuovo evento clinico",
          eventDate: dateStr || null,
          eventNotes: description || null,
          action: "created",
          eventType: type || null,
          visibility,
          source,
          priority: priority as any,
          weightKg,
          therapyStartDate,
          therapyEndDate,
          vetSignature,
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
          .single();

        const ownerId = (animalReminderRow as any)?.owner_id as string | undefined;
        const pendingOwnerEmail =
          ((animalReminderRow as any)?.pending_owner_email as string | undefined)?.trim() || null;
        const animalName =
          ((animalReminderRow as any)?.name as string | undefined) || "il tuo animale";

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
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.create",
      target_type: "event",
      target_id: data.id,
      animal_id: animalId,
      result: "success",
    });

    return NextResponse.json({ ok: true, event: data }, { status: 200 });
  } catch (error) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
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