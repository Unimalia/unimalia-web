import "server-only";

import { getProfessionalOrgId } from "@/lib/professionisti/org";
import {
  getOperatorSession,
  getWorkstationKeyFromRequest,
} from "@/lib/clinic/operatorSession";

export type RequiredClinicOperatorSession = {
  organizationId: string;
  workstationKey: string;
  operatorSessionId: string;
  activeOperatorUserId: string | null;
  activeOperatorProfessionalId: string | null;
  activeClinicOperatorId: string | null;
  activeOperatorLabel: string;
  pinVerifiedAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

type Result =
  | {
      ok: true;
      data: RequiredClinicOperatorSession;
    }
  | {
      ok: false;
      reason: string;
      status: number;
    };

export async function requireClinicOperatorSession(
  req: Request,
  authenticatedUserId: string
): Promise<Result> {
  const normalizedUserId = String(authenticatedUserId || "").trim();

  if (!normalizedUserId) {
    return {
      ok: false,
      reason: "Utente non autenticato.",
      status: 401,
    };
  }

  const organizationId = await getProfessionalOrgId(normalizedUserId);

  if (!organizationId) {
    return {
      ok: false,
      reason: "Profilo professionista non collegato a una organizzazione.",
      status: 403,
    };
  }

  const workstationKey = getWorkstationKeyFromRequest(req);

  if (!workstationKey) {
    return {
      ok: false,
      reason: "Postazione non identificata. Riapri la sessione operatore.",
      status: 400,
    };
  }

  const session = await getOperatorSession({
    organizationId,
    workstationKey,
  });

  if (!session) {
    return {
      ok: false,
      reason: "Nessun operatore attivo su questa postazione. Attiva l’operatore con PIN.",
      status: 403,
    };
  }

  return {
    ok: true,
    data: {
      organizationId,
      workstationKey,
      operatorSessionId: session.id,
      activeOperatorUserId: session.active_user_id,
      activeOperatorProfessionalId: session.active_professional_id ?? null,
      activeClinicOperatorId: session.active_clinic_operator_id,
      activeOperatorLabel: session.active_operator_label,
      pinVerifiedAt: session.pin_verified_at,
      lastSeenAt: session.last_seen_at,
      expiresAt: session.expires_at,
    },
  };
}