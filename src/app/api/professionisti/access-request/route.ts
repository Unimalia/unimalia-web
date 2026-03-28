import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { getCoreSystemFlags } from "@/lib/systemFlags";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import { isUuid } from "@/lib/server/validators";

function normalizeRequestedScope(input: unknown): Array<"read" | "write"> {
  const raw = Array.isArray(input) ? input : [];
  const filtered = raw
    .map((value) => String(value).trim().toLowerCase())
    .filter((value): value is "read" | "write" => value === "read" || value === "write");

  return Array.from(new Set(filtered));
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

    let orgId: string | null = null;

    try {
      orgId = await getProfessionalOrgId();
    } catch {
      orgId = null;
    }

    if (!orgId) {
      return NextResponse.json(
        {
          error: "Profilo professionista non valido o organizzazione non associata.",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body non valido" }, { status: 400 });
    }

    const animalId = String((body as any).animalId ?? (body as any).animal_id ?? "").trim();

    const requestedScope = normalizeRequestedScope(
      Array.isArray((body as any).permissions)
        ? (body as any).permissions
        : Array.isArray((body as any).requestedScope)
        ? (body as any).requestedScope
        : Array.isArray((body as any).requested_scope)
        ? (body as any).requested_scope
        : []
    );

    if (!animalId) {
      return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
    }

    if (!isUuid(animalId)) {
      return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
    }

    if (requestedScope.length === 0) {
      return NextResponse.json(
        { error: "Devi richiedere almeno uno scope valido (read o write)" },
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

    const existingGrant = await admin
      .from("animal_access_grants")
      .select("id, status, revoked_at")
      .eq("animal_id", animalId)
      .eq("grantee_type", "org")
      .eq("grantee_id", orgId)
      .in("status", ["active", "approved"])
      .is("revoked_at", null)
      .maybeSingle();

    if (existingGrant.error) {
      return NextResponse.json(
        { error: existingGrant.error.message || "Errore verifica grant" },
        { status: 500 }
      );
    }

    if (existingGrant.data) {
      return NextResponse.json({
        ok: true,
        alreadyGranted: true,
      });
    }

    const existingRequest = await admin
      .from("animal_access_requests")
      .select("id, status")
      .eq("animal_id", animalId)
      .eq("owner_id", animal.owner_id)
      .eq("org_id", orgId)
      .in("status", ["pending"])
      .maybeSingle();

    if (existingRequest.error) {
      return NextResponse.json(
        { error: existingRequest.error.message || "Errore verifica richiesta esistente" },
        { status: 500 }
      );
    }

    if (existingRequest.data) {
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
        requested_scope: requestedScope,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertResult.error || !insertResult.data) {
      return NextResponse.json(
        {
          error: insertResult.error?.message || "Errore richiesta accesso",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      requestId: insertResult.data.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Errore interno" }, { status: 500 });
  }
}