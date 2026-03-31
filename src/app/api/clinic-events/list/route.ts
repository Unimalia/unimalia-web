import { NextResponse } from "next/server";
import { createClient as createServerClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { isUuid } from "@/lib/server/validators";

type EventAuditRow = {
  event_id: string | null;
};

type AnimalClinicEventRow = {
  id: string;
  animal_id: string;
  event_date: string;
  type: string;
  title: string;
  description: string | null;
  visibility: string;
  source: string;
  verified_at: string | null;
  verified_by_user_id: string | null;
  verified_by_org_id: string | null;
  verified_by_member_id: string | null;
  verified_by_label: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  meta: Record<string, unknown> | null;
  priority: "low" | "normal" | "high" | "urgent" | null;
};

type RequireOwnerOrGrantClient = Parameters<typeof requireOwnerOrGrant>[0];
type SafeWriteAuditClient = Parameters<typeof safeWriteAudit>[0];

async function getFallbackReadableEventIds(params: {
  animalId: string;
  userId: string;
}) {
  const admin = supabaseAdmin();
  const organizationId = await getProfessionalOrgId();

  const ownAuditResult = await admin
    .from("animal_clinic_event_audit")
    .select("event_id")
    .eq("animal_id", params.animalId)
    .eq("actor_user_id", params.userId)
    .in("action", ["create", "update"]);

  if (ownAuditResult.error) {
    throw ownAuditResult.error;
  }

  let organizationEventIds: string[] = [];

  if (organizationId) {
    const orgAuditResult = await admin
      .from("animal_clinic_event_audit")
      .select("event_id")
      .eq("animal_id", params.animalId)
      .eq("actor_org_id", organizationId)
      .in("action", ["create", "update"]);

    if (orgAuditResult.error) {
      throw orgAuditResult.error;
    }

    organizationEventIds = (orgAuditResult.data ?? [])
      .map((row: EventAuditRow) => String(row.event_id || "").trim())
      .filter(Boolean);
  }

  const ownEventIds = (ownAuditResult.data ?? [])
    .map((row: EventAuditRow) => String(row.event_id || "").trim())
    .filter(Boolean);

  return Array.from(new Set([...ownEventIds, ...organizationEventIds]));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const animalId = String(url.searchParams.get("animalId") ?? "").trim();

  if (!animalId) {
    return NextResponse.json({ error: "animalId required" }, { status: 400 });
  }

  if (!isUuid(animalId)) {
    return NextResponse.json({ error: "animalId invalid" }, { status: 400 });
  }

  try {
    const supabase = await createServerClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grant = await requireOwnerOrGrant(
      supabase as RequireOwnerOrGrantClient,
      user.id,
      animalId,
      "read"
    );

    if (grant.ok) {
      const { data, error } = await admin
        .from("animal_clinic_events")
        .select(
          "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by_user_id, verified_by_org_id, verified_by_member_id, verified_by_label, created_by_user_id, created_at, updated_at, status, meta, priority"
        )
        .eq("animal_id", animalId)
        .neq("status", "void")
        .order("event_date", { ascending: false })
        .order("created_at", { ascending: false })
        .returns<AnimalClinicEventRow[]>();

      if (error) {
        await safeWriteAudit(supabase as SafeWriteAuditClient, {
          req,
          actor_user_id: user.id,
          actor_org_id: grant.actor_org_id,
          action: "animal.clinic.read",
          target_type: "animal",
          target_id: animalId,
          animal_id: animalId,
          result: "error",
          reason: error.message,
        });

        return NextResponse.json(
          { error: error.message || "Impossibile caricare eventi." },
          { status: 500 }
        );
      }

      await safeWriteAudit(supabase as SafeWriteAuditClient, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
        action: "animal.clinic.read",
        target_type: "animal",
        target_id: animalId,
        animal_id: animalId,
        result: "success",
      });

      return NextResponse.json(
        {
          ok: true,
          mode: "full",
          events: data ?? [],
        },
        { status: 200 }
      );
    }

    const fallbackEventIds = await getFallbackReadableEventIds({
      animalId,
      userId: user.id,
    });

    if (fallbackEventIds.length === 0) {
      await safeWriteAudit(supabase as SafeWriteAuditClient, {
        req,
        actor_user_id: user.id,
        actor_org_id: null,
        action: "animal.clinic.read",
        target_type: "animal",
        target_id: animalId,
        animal_id: animalId,
        result: "denied",
        reason: grant.reason,
      });

      return NextResponse.json({ error: grant.reason }, { status: 403 });
    }

    const { data, error } = await admin
      .from("animal_clinic_events")
      .select(
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by_user_id, verified_by_org_id, verified_by_member_id, verified_by_label, created_by_user_id, created_at, updated_at, status, meta, priority"
      )
      .eq("animal_id", animalId)
      .neq("status", "void")
      .in("id", fallbackEventIds)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<AnimalClinicEventRow[]>();

    if (error) {
      await safeWriteAudit(supabase as SafeWriteAuditClient, {
        req,
        actor_user_id: user.id,
        actor_org_id: null,
        action: "animal.clinic.read",
        target_type: "animal",
        target_id: animalId,
        animal_id: animalId,
        result: "error",
        reason: error.message,
      });

      return NextResponse.json(
        { error: error.message || "Impossibile caricare eventi." },
        { status: 500 }
      );
    }

    await safeWriteAudit(supabase as SafeWriteAuditClient, {
      req,
      actor_user_id: user.id,
      actor_org_id: null,
      action: "animal.clinic.read",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "success",
      reason: "fallback_own_history_audit_only",
    });

    return NextResponse.json(
      {
        ok: true,
        mode: "revoked_own_history",
        events: data ?? [],
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}