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
  eventIds?: string[];
  verifyAll?: boolean;
};

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

  // ✅ GRANT CHECK (WRITE) per validare
  const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "write");
  if (!grant.ok) {
    await writeAudit(supabase, {
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

  const verifyAll = !!body.verifyAll;
  const eventIds = (body.eventIds || []).filter(Boolean);

  try {
    // selezione target
    let q = supabase
      .from("animal_clinic_events")
      .update({
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        verified_by_org_id: grant.actor_org_id,
        verified_by_label: "Veterinario",
      })
      .eq("animal_id", animalId)
      .is("verified_at", null)
      .neq("status", "void");

    if (!verifyAll) {
      if (eventIds.length === 0) return NextResponse.json({ error: "eventIds required" }, { status: 400 });
      q = q.in("id", eventIds);
    }

    const { error } = await q;
    if (error) {
      await writeAudit(supabase, {
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

    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.verify",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "success",
      diff: { verifyAll, eventIdsCount: eventIds.length },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.verify",
      target_type: "animal",
      target_id: animalId,
      animal_id: animalId,
      result: "error",
      reason: "Unhandled server error",
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}