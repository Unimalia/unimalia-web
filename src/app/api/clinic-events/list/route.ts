import { NextResponse } from "next/server";
import { createClient as createServerClient, supabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { isUuid } from "@/lib/server/validators";

async function getProfessionalRefs(userId: string) {
  const admin = supabaseAdmin();
  const refs = new Set<string>();
  refs.add(userId);

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (profileResult.data?.org_id) {
    refs.add(profileResult.data.org_id);
  }

  const professionalResult = await admin
    .from("professionals")
    .select("id, owner_id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (professionalResult.error) {
    throw professionalResult.error;
  }

  if (professionalResult.data?.id) {
    refs.add(professionalResult.data.id);
  }

  return Array.from(refs).filter(Boolean);
}

async function getFallbackReadableEventIds(params: {
  animalId: string;
  userId: string;
}) {
  const admin = supabaseAdmin();
  const refs = await getProfessionalRefs(params.userId);

  const ownAuditResult = await admin
    .from("animal_clinic_event_audit")
    .select("event_id")
    .eq("animal_id", params.animalId)
    .eq("actor_user_id", params.userId)
    .in("action", ["create", "update"]);

  if (ownAuditResult.error) {
    throw ownAuditResult.error;
  }

  const orgRefs = refs.filter(
    (ref) => typeof ref === "string" && ref.length > 0 && ref !== params.userId
  );

  let orgEventIds: string[] = [];

  if (orgRefs.length > 0) {
    const orgAuditResult = await admin
      .from("animal_clinic_event_audit")
      .select("event_id")
      .eq("animal_id", params.animalId)
      .in("actor_org_id", orgRefs)
      .in("action", ["create", "update"]);

    if (orgAuditResult.error) {
      throw orgAuditResult.error;
    }

    orgEventIds = (orgAuditResult.data ?? [])
      .map((row: any) => String(row.event_id || "").trim())
      .filter(Boolean);
  }

  const ownEventIds = (ownAuditResult.data ?? [])
    .map((row: any) => String(row.event_id || "").trim())
    .filter(Boolean);

  return Array.from(new Set([...ownEventIds, ...orgEventIds]));
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

    const grant = await requireOwnerOrGrant(supabase as any, user.id, animalId, "read");

    if (grant.ok) {
      const { data, error } = await admin
        .from("animal_clinic_events")
        .select(
          "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by_user_id, verified_by_org_id, verified_by_member_id, verified_by_label, created_by_user_id, created_at, updated_at, status, meta, priority"
        )
        .eq("animal_id", animalId)
        .neq("status", "void")
        .order("event_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        await safeWriteAudit(supabase as any, {
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

      await safeWriteAudit(supabase as any, {
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
      await safeWriteAudit(supabase as any, {
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
      .order("created_at", { ascending: false });

    if (error) {
      await safeWriteAudit(supabase as any, {
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

    await safeWriteAudit(supabase as any, {
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
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}