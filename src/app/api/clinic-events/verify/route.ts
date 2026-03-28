import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";

type Body = {
  animalId: string;
  eventIds?: string[];
  verifyAll?: boolean;
};

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

  const isVet = user.app_metadata?.is_vet === true;

  if (!isVet) {
    return forbidden("Solo i veterinari possono verificare eventi clinici");
  }

  const body = (await req.json().catch(() => null)) as Body | null;

  if (!body) {
    return badRequest("Body JSON non valido");
  }

  const animalId = String(body.animalId || "").trim();

  if (!animalId) {
    return badRequest("animalId obbligatorio");
  }

  if (!isUuid(animalId)) {
    return badRequest("animalId non valido");
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

    return forbidden(grant.reason);
  }

  const verifyAll = body.verifyAll === true;

  const eventIds = Array.isArray(body.eventIds)
    ? Array.from(new Set(body.eventIds.map((id) => String(id).trim()).filter((id) => isUuid(id))))
    : [];

  try {
    if (!verifyAll && eventIds.length === 0) {
      return badRequest("eventIds obbligatorio se verifyAll è false");
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

      return badRequest(candidateErr.message || "Verifica eventi non riuscita");
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

      return badRequest(error.message || "Verifica eventi non riuscita");
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

    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}