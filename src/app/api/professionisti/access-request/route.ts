import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { getCoreSystemFlags } from "@/lib/systemFlags";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import { isUuid } from "@/lib/server/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFoundResponse() {
  return NextResponse.json(
    { error: "Not found" },
    {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

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

    if (
      !flags.owner_access_requests_enabled ||
      flags.emergency_mode ||
      flags.maintenance_mode
    ) {
      return notFoundResponse();
    }

    const supabase = await createClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return notFoundResponse();
    }

    let orgId: string | null = null;

    try {
      orgId = await getProfessionalOrgId();
    } catch {
      orgId = null;
    }

    if (!orgId) {
      return notFoundResponse();
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return notFoundResponse();
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

    if (!animalId || !isUuid(animalId)) {
      return notFoundResponse();
    }

    if (requestedScope.length === 0) {
      return notFoundResponse();
    }

    const animalResult = await admin
      .from("animals")
      .select("id, owner_id")
      .eq("id", animalId)
      .single();

    if (animalResult.error || !animalResult.data) {
      return notFoundResponse();
    }

    const animal = animalResult.data;

    if (!animal.owner_id) {
      return notFoundResponse();
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
        { error: "Server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (existingGrant.data) {
      return NextResponse.json(
        {
          ok: true,
          alreadyGranted: true,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
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
        { error: "Server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (existingRequest.data) {
      return NextResponse.json(
        {
          ok: true,
          alreadyPending: true,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
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
        { error: "Server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        requestId: insertResult.data.id,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}