import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";
import {
  getCurrentProfessionalOrganizationId,
  listClinicOperators,
  resolveOrganizationOperator,
} from "@/lib/clinic/operatorSession";

function unauthorized(message = "Non autorizzato") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(req: Request) {
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
  console.info("[clinic/operators/list] auth user", {
    userId: user?.id ?? null,
    hasUserError: Boolean(userErr),
  });

  if (userErr || !user || !isUuid(user.id)) {
    return unauthorized();
  }

  const organizationId = await getCurrentProfessionalOrganizationId(user.id);
  console.info("[clinic/operators/list] organization resolved", {
    userId: user.id,
    organizationId,
  });

  if (!organizationId) {
    return forbidden("Profilo professionista non collegato a una organizzazione.");
  }

  const [operators, actor] = await Promise.all([
    listClinicOperators(organizationId),
    resolveOrganizationOperator({
      organizationId,
      userId: user.id,
    }),
  ]);
  console.info("[clinic/operators/list] actor/operators", {
    userId: user.id,
    organizationId,
    actorFound: Boolean(actor),
    actorUserId: actor?.userId ?? null,
    actorProfessionalId: actor?.professionalId ?? null,
    operatorsCount: operators.length,
  });

  if (!actor) {
    return forbidden("Operatore clinico non configurato per questo utente.");
  }

  return NextResponse.json({
    ok: true,
    operators,
    actor,
  });
}