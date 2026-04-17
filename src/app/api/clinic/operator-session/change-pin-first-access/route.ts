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
  upsertOperatorPin,
  upsertOperatorSession,
  verifyOperatorPin,
} from "@/lib/clinic/operatorSession";

type Body = {
  currentPin?: string;
  newPin?: string;
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
  const currentPin = String(body?.currentPin || "").trim();
  const newPin = String(body?.newPin || "").trim();

  if (!isValidOperatorPin(currentPin)) {
    return badRequest("PIN attuale non valido: usa 4-8 cifre numeriche.");
  }

  if (!isValidOperatorPin(newPin)) {
    return badRequest("Nuovo PIN non valido: usa 4-8 cifre numeriche.");
  }

  if (currentPin === newPin) {
    return badRequest("Il nuovo PIN deve essere diverso da quello temporaneo.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
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

  try {
    const operator = await resolveOrganizationOperator({
      organizationId,
      userId: user.id,
    });

    if (!operator) {
      return forbidden("Operatore clinico non configurato per questo utente.");
    }

    if (!operator.isActive) {
      return forbidden("Operatore non attivo.");
    }

    const pinRow = await getOperatorPinRow({
      organizationId,
      clinicOperatorId: operator.clinicOperatorId,
    });

    if (!pinRow?.id || !pinRow.is_active || !pinRow.pin_hash) {
      return forbidden("PIN operatore non configurato.");
    }

    const isCurrentPinValid = verifyOperatorPin(currentPin, pinRow.pin_hash);

    if (!isCurrentPinValid) {
      return forbidden("PIN attuale non corretto.");
    }

    await upsertOperatorPin({
      organizationId,
      clinicOperatorId: operator.clinicOperatorId,
      pin: newPin,
      mustChangePin: false,
    });

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
  } catch (error) {
    console.error("[operator-session/change-pin-first-access] fatal error", {
      organizationId,
      workstationKey,
      userId: user.id,
      error,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore durante il cambio PIN del primo accesso.",
      },
      { status: 500 }
    );
  }
}