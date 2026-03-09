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

  const animalId = (body.animalId || "").trim();
  if (!animalId) return NextResponse.json({ error: "animalId required" }, { status: 400 });

  // ✅ GRANT CHECK (WRITE)
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
  const visibility = body.visibility || "professionals";
  const source = body.source || "professional";

  const dateStr = (body.eventDate || "").trim();
  if (!type || !title) return NextResponse.json({ error: "type/title required" }, { status: 400 });
  if (!dateStr || !isValidDateYYYYMMDD(dateStr)) {
    return NextResponse.json({ error: "eventDate must be YYYY-MM-DD" }, { status: 400 });
  }

  const weightKg = parseWeightKg((body as any).weightKg);
  const therapyStartDate = parseDateOnly((body as any).therapyStartDate);
  const therapyEndDate = parseDateOnly((body as any).therapyEndDate);
  const vetSignature =
    typeof (body as any).vetSignature === "string"
      ? (body as any).vetSignature.trim() || null
      : null;
  const vetSignatureMemberId =
    typeof (body as any).vetSignatureMemberId === "string"
      ? (body as any).vetSignatureMemberId.trim() || null
      : null;
  const priority =
    ["low", "normal", "high", "urgent"].includes(String((body as any).priority || ""))
      ? String((body as any).priority)
      : null;

  const meta: Record<string, any> = {};

  if (weightKg) meta.weight_kg = weightKg;
  if (vetSignature) meta.created_by_member_label = vetSignature;
  if (vetSignatureMemberId) meta.created_by_member_id = vetSignatureMemberId;
  if (priority) meta.priority = priority;

  if (type === "therapy") {
    if (therapyStartDate) meta.therapy_start_date = therapyStartDate;
    meta.therapy_end_date = therapyEndDate || null;
  }

  try {
    const { data, error } = await supabase
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
        verified_by_org_id: grant.actor_org_id,
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

    await supabase.from("animal_clinic_event_audit").insert({
      event_id: data.id,
      animal_id: animalId,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      actor_member_id: vetSignatureMemberId,
      action: "create",
      previous_data: null,
      next_data: data,
    });

    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.create",
      target_type: "event",
      target_id: (data as any).id,
      animal_id: animalId,
      result: "success",
    });

    // AUTO REMINDER VACCINI
    try {
      const nextDue = meta?.next_due_date;

      if (type === "vaccine" && nextDue) {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await admin.from("animal_reminders").insert({
          animal_id: animalId,
          type: "vaccine",
          title: `Richiamo vaccino`,
          due_date: nextDue,
          status: "scheduled",
        });
      }
    } catch (e) {
      console.error("Reminder creation failed", e);
    }

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