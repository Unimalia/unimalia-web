import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendOwnerAnimalUpdateEmail } from "@/lib/email/sendOwnerAnimalUpdateEmail";
import { createClinicalEventOwnerNotification } from "@/lib/notifications/create-owner-notification";

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
  animalId: string;
  type: string;
  title: string;
  description?: string | null;
  visibility?: "owner" | "professionals" | "emergency";
  eventDate?: string;
  source?: "professional" | "veterinarian";
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

async function resolveVerifiedByOrgId(userId: string): Promise<string | null> {
  const admin = supabaseAdmin();

  const profileResult = await admin
    .from("professional_profiles")
    .select("org_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.error) {
    return null;
  }

  const orgId =
    profileResult.data?.org_id && isUuid(String(profileResult.data.org_id))
      ? String(profileResult.data.org_id)
      : null;

  if (!orgId) return null;

  const orgCheck = await admin
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .maybeSingle();

  if (orgCheck.error || !orgCheck.data?.id) {
    return null;
  }

  return orgId;
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

  const admin = supabaseAdmin();

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const animalId = (body.animalId || "").trim();
  if (!animalId) {
    return NextResponse.json({ error: "animalId required" }, { status: 400 });
  }

  if (!isUuid(animalId)) {
    return NextResponse.json({ error: "animalId invalid" }, { status: 400 });
  }

  const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "write");
  if (!grant.ok) {
    await writeAudit(supabase, {
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
    return NextResponse.json({ error: grant.reason }, { status: 403 });
  }

  const type = (body.type || "").trim();
  const title = (body.title || "").trim();
  const description = (body.description ?? "").toString().trim() || null;

  const visibility =
    body.visibility === "owner" ||
    body.visibility === "professionals" ||
    body.visibility === "emergency"
      ? body.visibility
      : "professionals";

  const source =
    body.source === "professional" || body.source === "veterinarian"
      ? body.source
      : "professional";

  const dateStr = (body.eventDate || "").trim();
  if (!type || !title) {
    return NextResponse.json({ error: "type/title required" }, { status: 400 });
  }
  if (!dateStr || !isValidDateYYYYMMDD(dateStr)) {
    return NextResponse.json({ error: "eventDate must be YYYY-MM-DD" }, { status: 400 });
  }

  const weightKg = parseWeightKg(body.weightKg);
  const therapyStartDate = parseDateOnly(body.therapyStartDate);
  const therapyEndDate = parseDateOnly(body.therapyEndDate);

  const vetSignature =
    typeof body.vetSignature === "string" ? body.vetSignature.trim() || null : null;

  const vetSignatureMemberId =
    typeof body.vetSignatureMemberId === "string"
      ? body.vetSignatureMemberId.trim() || null
      : null;

  const priority =
    ["low", "normal", "high", "urgent"].includes(String(body.priority || ""))
      ? String(body.priority)
      : null;

  const verifiedByOrgId =
    source === "veterinarian" ? await resolveVerifiedByOrgId(user.id) : null;

  const meta: Record<string, any> = {};

  const incomingMeta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? body.meta
      : null;

  if (incomingMeta) {
    Object.assign(meta, incomingMeta);
  }

  if (weightKg !== null) meta.weight_kg = weightKg;
  if (vetSignature) meta.created_by_member_label = vetSignature;
  if (vetSignatureMemberId) meta.created_by_member_id = vetSignatureMemberId;
  if (priority) meta.priority = priority;

  if (type === "therapy") {
    if (therapyStartDate) meta.therapy_start_date = therapyStartDate;
    meta.therapy_end_date = therapyEndDate || null;
  }

  try {
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
        verified_at: source === "veterinarian" ? new Date().toISOString() : null,
        verified_by: source === "veterinarian" ? user.id : null,
        verified_by_org_id: verifiedByOrgId,
        meta,
        priority: priority || null,
        status: "active",
      })
      .select(
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by, verified_by_org_id, verified_by_member_id, verified_by_label, created_by, created_at, updated_at, status, meta"
      )
      .single();

    if (error || !data) {
      await writeAudit(supabase, {
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
      return NextResponse.json({ error: error?.message || "Create failed" }, { status: 400 });
    }

    await admin.from("animal_clinic_event_audit").insert({
      event_id: data.id,
      animal_id: animalId,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      actor_member_id: vetSignatureMemberId,
      action: "create",
      previous_data: null,
      next_data: data,
    });

    try {
      const { data: animalRow, error: animalRowError } = await admin
        .from("animals")
        .select("id, name, owner_id")
        .eq("id", animalId)
        .single();

      if (animalRowError) {
        console.error("[OWNER_NOTIFICATION_ANIMAL_FETCH_ERROR]", animalRowError);
      } else if (animalRow?.owner_id) {
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
      await sendOwnerAnimalUpdateEmail({
        animalId,
        eventTitle: title || "Nuovo evento clinico",
        eventDate: dateStr || null,
        eventNotes: description || null,
      });
    } catch (emailError) {
      console.error("[CLINIC_EVENT_OWNER_EMAIL]", emailError);
    }

    if (type === "vaccine" && body.reminderEnabled && body.remindEmail !== false) {
      try {
        const { data: animalRow } = await admin
          .from("animals")
          .select("owner_id,name")
          .eq("id", animalId)
          .single();

        const ownerId = (animalRow as any)?.owner_id as string | undefined;
        const animalName = ((animalRow as any)?.name as string | undefined) || "il tuo animale";

        let ownerEmail: string | null = null;

        if (ownerId) {
          const authResp = await admin.auth.admin.getUserById(ownerId);
          ownerEmail = authResp?.data?.user?.email ?? null;
        }

        const nextDueDate =
          typeof meta.next_due_date === "string" && meta.next_due_date.trim()
            ? meta.next_due_date.trim()
            : null;

        const remindAt =
          typeof body.remindAt === "string" && body.remindAt.trim()
            ? body.remindAt.trim()
            : null;

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
        console.error("Automatic vaccine reminder creation failed:", reminderError);
      }
    }

    await writeAudit(supabase, {
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
  } catch {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.create",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "error",
      reason: "Unhandled server error",
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}