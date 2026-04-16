import { NextResponse } from "next/server";
import { createClient as createServerClient, supabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { isUuid } from "@/lib/server/validators";

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
  verified_by_organization_id: string | null;
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

function isVetUser(user: {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const email = String(user?.email || "").toLowerCase().trim();
  if (email === "valentinotwister@hotmail.it") return true;
  return Boolean(user?.app_metadata?.is_vet || user?.user_metadata?.is_vet);
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

    if (!isVetUser(user)) {
      await safeWriteAudit(supabase as SafeWriteAuditClient, {
        req,
        actor_user_id: user.id,
        actor_organization_id: null,
        action: "animal.clinic.read",
        target_type: "animal",
        target_id: animalId,
        animal_id: animalId,
        result: "denied",
        reason: "Cartella clinica riservata ai veterinari.",
      });

      return NextResponse.json(
        { error: "Cartella clinica riservata ai veterinari autorizzati." },
        { status: 403 }
      );
    }

    const grant = await requireOwnerOrGrant(
      supabase as RequireOwnerOrGrantClient,
      user.id,
      animalId,
      "read"
    );

    if (!grant.ok) {
      await safeWriteAudit(supabase as SafeWriteAuditClient, {
        req,
        actor_user_id: user.id,
        actor_organization_id: null,
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
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by_user_id, verified_by_organization_id, verified_by_member_id, verified_by_label, created_by_user_id, created_at, updated_at, status, meta, priority"
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
        actor_organization_id: grant.actor_organization_id,
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
      actor_organization_id: grant.actor_organization_id,
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
        canWrite: true,
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
