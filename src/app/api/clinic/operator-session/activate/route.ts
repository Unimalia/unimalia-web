import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";
import {
  getCurrentProfessionalOrganizationId,
  getOperatorPinRow,
  getWorkstationKeyFromRequest,
  isValidOperatorPin,
  resolveOrganizationOperator,
  upsertOperatorSession,
  verifyOperatorPin,
} from "@/lib/clinic/operatorSession";

type Body = {
  pin?: string;
  clinicOperatorId?: string;
};

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

  const body = (await req.json().catch(() => null)) as Body | null;
  const pin = String(body?.pin || "").trim();
  const clinicOperatorId = String(body?.clinicOperatorId || "").trim();

  if (!isValidOperatorPin(pin)) {
    return badRequest("PIN non valido: usa 4-8 cifre numeriche.");
  }

  if (!clinicOperatorId || !isUuid(clinicOperatorId)) {
    return badRequest("clinicOperatorId non valido");
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

  const operator = await resolveOrganizationOperator({
    organizationId,
    clinicOperatorId,
  });

  if (!operator) {
    return forbidden("Operatore non disponibile per questa organizzazione.");
  }

  if (!operator.isActive) {
    return forbidden("Operatore non attivo.");
  }

  const pinRow = await getOperatorPinRow({
    organizationId,
    clinicOperatorId,
  });

  if (!pinRow?.id || !pinRow.is_active || !pinRow.pin_hash) {
    return forbidden("PIN operatore non configurato.");
  }

  const isValid = verifyOperatorPin(pin, pinRow.pin_hash);

  if (!isValid) {
    return forbidden("PIN non corretto.");
  }

  const session = await upsertOperatorSession({
    organizationId,
    workstationKey,
    clinicOperatorId: operator.clinicOperatorId,
    activeUserId: operator.userId,
    activeProfessionalId: operator.professionalId,
    activeOperatorLabel: operator.label,
    activeOperatorRole: operator.role,
    activeOperatorIsVeterinarian: operator.isVet,
    activeOperatorFnoviNumber: operator.fnoviNumber,
    activeOperatorFnoviProvince: operator.fnoviProvince,
  });

  return NextResponse.json({
    ok: true,
    mustChangePin: Boolean(pinRow.must_change_pin),
    session: {
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
    },
  });
}