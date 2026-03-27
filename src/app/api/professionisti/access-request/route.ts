import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { getCoreSystemFlags } from "@/lib/systemFlags";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(req: NextRequest) {
  try {
    const flags = await getCoreSystemFlags();

    if (!flags.owner_access_requests_enabled || flags.emergency_mode || flags.maintenance_mode) {
      return NextResponse.json(
        { error: "Richieste accesso temporaneamente non disponibili" },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const orgId = await getProfessionalOrgId();

    if (!orgId) {
      return NextResponse.json(
        {
          error:
            "Profilo professionista non valido o organizzazione non associata.",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);

    const animalId = String(body?.animalId ?? body?.animal_id ?? "").trim();

    if (!animalId || !isUuid(animalId)) {
      return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
    }

    // 🔒 NORMALIZZAZIONE PERMESSI (solo read/write)
    const rawPermissions = Array.isArray(body?.permissions)
      ? body.permissions
      : Array.isArray(body?.requestedScope)
      ? body.requestedScope
      : Array.isArray(body?.requested_scope)
      ? body.requested_scope
      : [];

    const permissions = Array.from(
      new Set(
        rawPermissions.filter(
          (p: any) => p === "read" || p === "write"
        )
      )
    );

    if (permissions.length === 0) {
      return NextResponse.json(
        { error: "Permessi non validi (read/write richiesti)" },
        { status: 400 }
      );
    }

    const animalResult = await admin
      .from("animals")
      .select("id, owner_id")
      .eq("id", animalId)
      .single();

    if (animalResult.error || !animalResult.data) {
      return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
    }

    const animal = animalResult.data;

    if (!animal.owner_id) {
      return NextResponse.json(
        {
          error:
            "Questo animale non ha ancora un proprietario collegato. Usa 'Collega proprietario' invece di richiedere accesso.",
        },
        { status: 409 }
      );
    }

    // 🔒 CHECK GRANT ATTIVO (solo org!)
    const existingGrant = await admin
      .from("animal_access_grants")
      .select("id")
      .eq("animal_id", animalId)
      .eq("grantee_id", orgId)
      .eq("grantee_type", "org")
      .in("status", ["active", "approved"])
      .limit(1);

    if (existingGrant.data && existingGrant.data.length > 0) {
      return NextResponse.json({
        ok: true,
        alreadyGranted: true,
      });
    }

    // 🔒 CHECK REQUEST PENDING
    const existingRequest = await admin
      .from("animal_access_requests")
      .select("id")
      .eq("animal_id", animalId)
      .eq("owner_id", animal.owner_id)
      .eq("org_id", orgId)
      .eq("status", "pending")
      .limit(1);

    if (existingRequest.data && existingRequest.data.length > 0) {
      return NextResponse.json({
        ok: true,
        alreadyPending: true,
      });
    }

    const insertResult = await admin
      .from("animal_access_requests")
      .insert({
        animal_id: animalId,
        owner_id: animal.owner_id,
        org_id: orgId,
        requested_by: user.id,
        requested_scope: permissions,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertResult.error) {
      return NextResponse.json(
        {
          error: insertResult.error.message || "Errore richiesta accesso",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      requestId: insertResult.data.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore interno" },
      { status: 500 }
    );
  }
}