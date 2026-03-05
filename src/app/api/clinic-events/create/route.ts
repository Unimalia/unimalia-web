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
  eventDate?: string; // YYYY-MM-DD
  source?: "professional" | "veterinarian";
  // ✅ nuovo: peso (kg)
  weightKg?: number | null;
};

function isValidDateYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
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

  // ✅ nuovo: peso dentro meta (no migrazioni DB)
  const weightKg = parseWeightKg((body as any).weightKg);
  const meta = weightKg ? { weight_kg: weightKg } : {};

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
        created_by: user.id, // ✅ sempre
        event_date: dateStr,
        verified_at: source === "veterinarian" ? new Date().toISOString() : null,
        verified_by: source === "veterinarian" ? user.id : null,
        verified_by_org_id: grant.actor_org_id,
        meta,
        status: "active",
      })
      .select("*")
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