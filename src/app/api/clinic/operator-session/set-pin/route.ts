import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";
import {
  getCurrentProfessionalOrganizationId,
  isValidOperatorPin,
  resolveOrganizationOperator,
  upsertOperatorPin,
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

  await upsertOperatorPin({
    organizationId,
    clinicOperatorId,
    pin,
  });

  return NextResponse.json({ ok: true });
}
