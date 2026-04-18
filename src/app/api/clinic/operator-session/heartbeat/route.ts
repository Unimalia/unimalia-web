import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";
import {
  getCurrentProfessionalOrganizationId,
  getOperatorSession,
  getWorkstationKeyFromRequest,
  heartbeatOperatorSession,
} from "@/lib/clinic/operatorSession";

function unauthorized(message = "Non autorizzato") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
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

  const workstationKey = getWorkstationKeyFromRequest(req);

  if (!workstationKey) {
    return badRequest("workstationKey mancante");
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;

  if (userErr || !user || !isUuid(user.id)) {
    return unauthorized();
  }

  const organizationId = await getCurrentProfessionalOrganizationId(user.id);

  if (!organizationId) {
    return forbidden("Profilo professionista non collegato a una organizzazione.");
  }

  console.info("[heartbeat] Request received", {
    organizationId,
    workstationKey,
    userId: user.id,
  });

  const existing = await getOperatorSession({
    organizationId,
    workstationKey,
  });

  if (!existing) {
    console.info("[heartbeat] No existing session found", {
      organizationId,
      workstationKey,
    });
    return NextResponse.json({ ok: true, session: null });
  }

  let session;
  try {
    session = await heartbeatOperatorSession({
      organizationId,
      workstationKey,
    });
    console.info("[heartbeat] Session updated successfully", {
      organizationId,
      workstationKey,
      sessionId: session?.id,
    });
  } catch (error) {
    console.error("[heartbeat] Failed to update session", {
      organizationId,
      workstationKey,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return existing session data even if update failed
    return NextResponse.json({
      ok: false,
      session: existing
        ? {
            id: existing.id,
            organizationId: existing.organization_id,
            workstationKey: existing.workstation_key,
            activeClinicOperatorId: existing.active_clinic_operator_id,
            activeUserId: existing.active_user_id,
            activeProfessionalId: existing.active_professional_id,
            activeOperatorLabel: existing.active_operator_label,
            activeOperatorRole: existing.active_operator_role,
            activeOperatorIsVeterinarian: existing.active_operator_is_veterinarian,
            activeOperatorFnoviNumber: existing.active_operator_fnovi_number,
            activeOperatorFnoviProvince: existing.active_operator_fnovi_province,
            pinVerifiedAt: existing.pin_verified_at,
            lastSeenAt: existing.last_seen_at,
            expiresAt: existing.expires_at,
            signatureMode: existing.signature_mode,
          }
        : null,
    });
  }

  return NextResponse.json({
    ok: true,
    session: session
      ? {
          id: session.id,
          organizationId: session.organization_id,
          workstationKey: session.workstation_key,
          activeClinicOperatorId: session.active_clinic_operator_id,
          activeUserId: session.active_user_id,
          activeProfessionalId: session.active_professional_id,
          activeOperatorLabel: session.active_operator_label,
          activeOperatorRole: session.active_operator_role,
          activeOperatorIsVeterinarian: session.active_operator_is_veterinarian,
          activeOperatorFnoviNumber: session.active_operator_fnovi_number,
          activeOperatorFnoviProvince: session.active_operator_fnovi_province,
          pinVerifiedAt: session.pin_verified_at,
          lastSeenAt: session.last_seen_at,
          expiresAt: session.expires_at,
          signatureMode: session.signature_mode,
        }
      : null,
  });
}