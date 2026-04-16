import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";
import {
  createClinicOperator,
  getCurrentProfessionalOrganizationId,
  resolveOrganizationOperator,
  upsertOperatorPin,
} from "@/lib/clinic/operatorSession";

type Body = {
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  role?: string;
  isVeterinarian?: boolean;
  isPrescriber?: boolean;
  fnoviNumber?: string | null;
  fnoviProvince?: string | null;
  taxCode?: string | null;
  email?: string | null;
  phone?: string | null;
  approvalNotes?: string | null;
  canUseRev?: boolean;
  initialPin?: string | null;
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

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim();
}

function normalizeNullableText(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeProvince(value: string | null | undefined) {
  const normalized = normalizeText(value).toUpperCase();
  return normalized || null;
}

function normalizeTaxCode(value: string | null | undefined) {
  const normalized = normalizeText(value).toUpperCase();
  return normalized || null;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || null;
}

function isValidInitialPin(pin: string | null) {
  if (!pin) return false;
  return /^\d{4,8}$/.test(pin);
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

  const actor = await resolveOrganizationOperator({
    organizationId,
    userId: user.id,
  });

  if (!actor) {
    return forbidden("Operatore clinico non configurato per questo utente.");
  }

  if (!actor.isMedicalDirector && !actor.canManageOperators) {
    return forbidden(
      "Solo il direttore sanitario o un gestore autorizzato può creare operatori."
    );
  }

  const body = (await req.json().catch(() => null)) as Body | null;

  if (!body) {
    return badRequest("Body JSON non valido");
  }

  const firstName = normalizeText(body.firstName);
  const lastName = normalizeText(body.lastName);
  const displayName = normalizeNullableText(body.displayName);
  const role = normalizeText(body.role);
  const isVeterinarian = Boolean(body.isVeterinarian);
  const isPrescriber = isVeterinarian ? Boolean(body.isPrescriber) : false;
  const fnoviNumber = isVeterinarian ? normalizeNullableText(body.fnoviNumber) : null;
  const fnoviProvince = isVeterinarian ? normalizeProvince(body.fnoviProvince) : null;
  const taxCode = normalizeTaxCode(body.taxCode);
  const email = normalizeEmail(body.email);
  const phone = normalizeNullableText(body.phone);
  const approvalNotes = normalizeNullableText(body.approvalNotes);
  const canUseRev = isVeterinarian ? Boolean(body.canUseRev) : false;
  const initialPin = normalizeNullableText(body.initialPin);

  if (!firstName) return badRequest("Nome operatore obbligatorio.");
  if (!lastName) return badRequest("Cognome operatore obbligatorio.");
  if (!role) return badRequest("Ruolo operatore obbligatorio.");

  if (!isValidInitialPin(initialPin)) {
    return badRequest("PIN iniziale obbligatorio: 4-8 cifre numeriche.");
  }

  if (isVeterinarian) {
    if (!fnoviNumber) return badRequest("Numero FNOVI obbligatorio per veterinario.");
    if (!fnoviProvince) return badRequest("Provincia albo obbligatoria per veterinario.");
    if (!taxCode) return badRequest("Codice fiscale obbligatorio per veterinario.");
    if (!email) return badRequest("Email obbligatoria per veterinario.");
  }

  try {
    const operator = await createClinicOperator({
      organizationId,
      firstName,
      lastName,
      displayName,
      role,
      isVeterinarian,
      isPrescriber,
      fnoviNumber,
      fnoviProvince,
      taxCode,
      email,
      phone,
      approvalStatus: "active",
      approvedByMedicalDirectorUserId: user.id,
      approvedAt: new Date().toISOString(),
      approvalNotes,
      isMedicalDirector: false,
      canManageOperators: false,
      canUseRev,
      revEnabled: false,
      revIntegrationStatus: "not_configured",
      userId: null,
      professionalId: null,
    });

    await upsertOperatorPin({
      organizationId,
      clinicOperatorId: operator.id,
      pin: initialPin!,
    });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await admin
      .from("clinic_operator_pins_v2")
      .update({
        must_change_pin: true,
      })
      .eq("organization_id", organizationId)
      .eq("clinic_operator_id", operator.id);

    return NextResponse.json({
      ok: true,
      operator: {
        clinicOperatorId: operator.id,
        userId: operator.user_id,
        professionalId: operator.professional_id,
        label: operator.display_name,
        role: operator.role,
        isVet: Boolean(operator.is_veterinarian),
        isPrescriber: Boolean(operator.is_prescriber),
        fnoviNumber: operator.fnovi_number,
        fnoviProvince: operator.fnovi_province,
        approvalStatus: operator.approval_status,
        isActive: Boolean(operator.is_active),
        canUseRev: Boolean(operator.can_use_rev),
        isMedicalDirector: Boolean(operator.is_medical_director),
        canManageOperators: Boolean(operator.can_manage_operators),
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossibile creare l’operatore clinico.",
      },
      { status: 500 }
    );
  }
}