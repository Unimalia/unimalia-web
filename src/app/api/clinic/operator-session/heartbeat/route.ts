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

  const existing = await getOperatorSession({
    organizationId,
    workstationKey,
  });

  if (!existing) {
    return NextResponse.json({ ok: true, session: null });
  }

  const session = await heartbeatOperatorSession({
    organizationId,
    workstationKey,
  });

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