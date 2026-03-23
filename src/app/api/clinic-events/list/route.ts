import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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
    const supabase = await createClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "read");

    let query = admin
      .from("animal_clinic_events")
      .select(
        "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by, verified_by_org_id, verified_by_member_id, verified_by_label, created_by, created_at, updated_at, status, meta, priority"
      )
      .eq("animal_id", animalId)
      .neq("status", "void")
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!grant.ok) {
      // Fallback: senza grant il professionista vede solo gli eventi creati da lui.
      // ASSUNZIONE: animal_clinic_events.created_by contiene user.id dell'utente autenticato.
      query = query.eq("created_by", user.id);
    }

    const { data, error } = await query;

    if (error) {
      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.ok ? grant.actor_org_id : null,
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

    if (!grant.ok && (!data || data.length === 0)) {
      await writeAudit(supabase, {
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

    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.ok ? grant.actor_org_id : null,
      action: "animal.clinic.read",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "success",
      reason: grant.ok ? undefined : "fallback_own_events_only",
    });

    return NextResponse.json(
      {
        ok: true,
        mode: grant.ok ? "full" : "own_only",
        events: data ?? [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}