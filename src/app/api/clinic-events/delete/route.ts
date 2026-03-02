import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

type Body = { id: string };

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

  const id = (body.id || "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: current, error: readErr } = await supabase
    .from("animal_clinic_events")
    .select("*")
    .eq("id", id)
    .single();

  if (readErr || !current) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const animalId = (current as any).animal_id as string;

  // ✅ GRANT CHECK (WRITE)
  const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "write");
  if (!grant.ok) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      action: "event.delete",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });
    return NextResponse.json({ error: grant.reason }, { status: 403 });
  }

  const source = (current as any).source as string;
  const createdBy = ((current as any).created_by as string | null) ?? null;

  if (source !== "owner") {
    if (!createdBy || createdBy !== user.id) {
      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
        action: "event.delete",
        target_type: "event",
        target_id: id,
        animal_id: animalId,
        result: "denied",
        reason: "Non autorizzato: puoi eliminare solo eventi owner o i tuoi eventi.",
      });
      return NextResponse.json(
        { error: "Non autorizzato: puoi eliminare solo eventi owner o i tuoi eventi." },
        { status: 403 }
      );
    }
  }

  const { error } = await supabase
    .from("animal_clinic_events")
    .update({ status: "void" })
    .eq("id", id);

  if (error) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.delete",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "error",
      reason: error.message,
    });
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 400 });
  }

  await writeAudit(supabase, {
    req,
    actor_user_id: user.id,
    actor_org_id: grant.actor_org_id,
    action: "event.delete",
    target_type: "event",
    target_id: id,
    animal_id: animalId,
    result: "success",
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}