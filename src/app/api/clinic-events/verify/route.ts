import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";

type Body = {
  id: string;
};

type AnimalClinicEventVerifyRow = {
  id: string;
  animal_id: string;
  status: string | null;
  verified_at: string | null;
  source: string | null;
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

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function unauthorized(message = "Non autorizzato") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function POST(req: Request) {
  const token = getBearerToken(req);

  if (!token) {
    return unauthorized("Token Bearer mancante");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { error: "Server configurato in modo non valido" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;

  if (userErr || !user) {
    return unauthorized();
  }

  const body = (await req.json().catch(() => null)) as Body | null;

  if (!body) {
    return badRequest("Body JSON non valido");
  }

  const id = String(body.id || "").trim();

  if (!id) {
    return badRequest("id obbligatorio");
  }

  if (!isUuid(id)) {
    return badRequest("id non valido");
  }

  const { data: current, error: readErr } = await supabase
    .from("animal_clinic_events")
    .select("id, animal_id, status, verified_at, source")
    .eq("id", id)
    .single<AnimalClinicEventVerifyRow>();

  if (readErr || !current) {
    return NextResponse.json({ error: "Evento non trovato" }, { status: 404 });
  }

  const animalId = String(current.animal_id || "");

  if (!animalId || !isUuid(animalId)) {
    return badRequest("animal_id evento non valido");
  }

  const grant = await requireOwnerOrGrant(
    supabase as RequireOwnerOrGrantClient,
    user.id,
    animalId,
    "write"
  );

  if (!grant.ok) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      action: "event.verify",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });

    return forbidden(grant.reason);
  }

  if (current.status === "void") {
    return badRequest("Evento annullato non verificabile");
  }

  const nowIso = new Date().toISOString();
  const verifierLabel = "Veterinario";

  const { data: updated, error } = await supabase
    .from("animal_clinic_events")
    .update({
      verified_at: nowIso,
      verified_by_user_id: user.id,
      verified_by_org_id: grant.actor_org_id ?? null,
      verified_by_member_id: user.id,
      verified_by_label: verifierLabel,
    })
    .eq("id", id)
    .select(
      "id, animal_id, event_date, type, title, description, visibility, source, verified_at, verified_by_user_id, verified_by_org_id, verified_by_member_id, verified_by_label, created_by_user_id, created_at, updated_at, status, meta, priority"
    )
    .single<AnimalClinicEventRow>();

  if (error || !updated) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "event.verify",
      target_type: "event",
      target_id: id,
      animal_id: animalId,
      result: "error",
      reason: error?.message || "verify failed",
    });

    return badRequest(error?.message || "Verifica evento non riuscita");
  }

  try {
    await supabase.from("animal_clinic_event_audit").insert({
      event_id: id,
      animal_id: animalId,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      actor_member_id: user.id,
      action: "verify",
      previous_data: current,
      next_data: updated,
    });
  } catch (auditInsertError) {
    console.error("[CLINIC_EVENT_AUDIT_INSERT_ERROR]", auditInsertError);
  }

  await safeWriteAudit(supabase, {
    req,
    actor_user_id: user.id,
    actor_org_id: grant.actor_org_id,
    action: "event.verify",
    target_type: "event",
    target_id: id,
    animal_id: animalId,
    result: "success",
  });

  return NextResponse.json({ ok: true, event: updated }, { status: 200 });
}