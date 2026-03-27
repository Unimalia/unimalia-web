import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";

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
  eventIds?: string[];
  verifyAll?: boolean;
};

async function safeWriteAudit(
  supabase: SupabaseClient<any, "public", any>,
  payload: Parameters<typeof writeAudit>[1]
) {
  try {
    await writeAudit(supabase as any, payload);
  } catch (error) {
    console.error("[AUDIT_WRITE_ERROR]", error);
  }
}

export async function POST(req: Request) {
  const token = getBearerToken(req);

  if (!token) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }

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

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isVet = user.app_metadata?.is_vet === true;

  if (!isVet) {
    return NextResponse.json(
      { error: "Solo i veterinari possono verificare eventi clinici" },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => null)) as Body | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const animalId = String(body.animalId || "").trim();

  if (!animalId) {
    return NextResponse.json({ error: "animalId required" }, { status: 400 });
  }

  if (!isUuid(animalId)) {
    return NextResponse.json({ error: "animalId invalid" }, { status: 400 });
  }

  const grant = await requireOwnerOrGrant(supabase as any, user.id, animalId, "write");

  if (!grant.ok) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      action: "event.verify",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });

    return NextResponse.json({ error: grant.reason }, { status: 403 });
  }

  const verifyAll = body.verifyAll === true;

  const eventIds = Array.isArray(body.eventIds)
    ? Array.from(
        new Set(
          body.eventIds
            .map((id) => String(id).trim())
            .filter((id) => isUuid(id))
        )
      )
    : [];

  try {
    if (!verifyAll && eventIds.length === 0) {
      return NextResponse.json({ error: "eventIds required" }, { status: 400 });
    }

    let candidateQuery = supabase
      .from("animal_clinic_events")
      .select("id, animal_id, status, verified_at, source")
      .eq("animal_id", animalId)
      .neq("status", "void")
      .is("verified_at", null);

    if (!verifyAll) {
      candidateQuery = candidateQuery.in("id", eventIds);
    }

    const { data: candidates, error: candidateErr } = await candidateQuery;

    if (candidateErr) {
      await safeWriteAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
        action: "event.verify",
        target_type: "animal",
        target_id: animalId,
        animal_id: animalId,
        result: "error",
        reason: candidateErr.message,
      });

      return NextResponse.json({ error: candidateErr.message || "Verify failed" }, { status: 400 });
    }

    const candidateIds = (candidates ?? []).map((row: any) => String(row.id));

    if (candidateIds.length === 0) {
      await safeWriteAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
        action: "event.verify",
        target_type: "animal",
        target_id: animalId,
        animal_id: animalId,
        result: "success",
        diff: { verifyAll, eventIdsCount: eventIds.length, verifiedCount: 0 },
      });

      return NextResponse.json({ ok: true, verifiedCount: 0 }, { status: 200 });
    }

    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from("animal_clinic_events")
      .update({
        verified_at: nowIso,
        verified_by: user.id,
        verified_by_org_id: grant.actor_org_id,
        verified_by_label: "Veterinario",
      })
      .in("id", candidateIds)
      .eq("animal_id", animalId)
      .is("verified_at", null)
      .neq("status", "void");

    if (error) {
      await safeWriteAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
        action: "event.verify",
        target_type: "animal",
        target_id: animalId,
        animal_id: animalId,
        result: "error",
        reason: error.message,
      });

      return NextResponse.json({ error: error.message || "Verify failed" }, { status: 400 });
    }

    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.verify",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "success",
      diff: {
        verifyAll,
        eventIdsCount: eventIds.length,
        verifiedCount: candidateIds.length,
      },
    });

    return NextResponse.json(
      { ok: true, verifiedCount: candidateIds.length },
      { status: 200 }
    );
  } catch (error) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.verify",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "error",
      reason: error instanceof Error ? error.message : "Unhandled server error",
    });

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}