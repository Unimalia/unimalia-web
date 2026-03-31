import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { getCoreSystemFlags } from "@/lib/systemFlags";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import { isUuid } from "@/lib/server/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccessRequestBody = {
  animalId?: string;
  animal_id?: string;
  chip?: string;
  microchip?: string;
  permissions?: unknown;
  requestedScope?: unknown;
  requested_scope?: unknown;
};

type AnimalLookupRow = {
  id: string;
  owner_id: string | null;
  chip_number: string | null;
};

type ExistingGrantRow = {
  id: string;
  status: string | null;
  revoked_at: string | null;
};

type ExistingRequestRow = {
  id: string;
  status: string | null;
};

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

function digitsOnly(value: unknown) {
  return String(value ?? "").replace(/\D+/g, "").trim();
}

async function resolveAnimalId(params: {
  admin: ReturnType<typeof supabaseAdmin>;
  animalIdRaw: string;
  chipRaw: string;
}) {
  const { admin, animalIdRaw, chipRaw } = params;

  if (animalIdRaw) {
    if (!isUuid(animalIdRaw)) {
      return { animal: null, error: "Invalid animalId" as const };
    }

    const animalResult = await admin
      .from("animals")
      .select("id, owner_id, chip_number")
      .eq("id", animalIdRaw)
      .maybeSingle<AnimalLookupRow>();

    if (animalResult.error) {
      return {
        animal: null,
        error: `Animal lookup by id failed: ${animalResult.error.message}` as const,
      };
    }

    if (!animalResult.data) {
      return { animal: null, error: "Animal not found" as const };
    }

    return { animal: animalResult.data, error: null };
  }

  if (chipRaw) {
    const chip = digitsOnly(chipRaw);

    if (!chip || (chip.length !== 15 && chip.length !== 10)) {
      return { animal: null, error: "Invalid chip" as const };
    }

    const chipResult = await admin
      .from("animals")
      .select("id, owner_id, chip_number")
      .eq("chip_number", chip)
      .limit(2)
      .returns<AnimalLookupRow[]>();

    if (chipResult.error) {
      return {
        animal: null,
        error: `Animal lookup by chip failed: ${chipResult.error.message}` as const,
      };
    }

    const rows = chipResult.data ?? [];

    if (rows.length === 0) {
      return { animal: null, error: "Animal not found" as const };
    }

    if (rows.length > 1) {
      return { animal: null, error: "Multiple animals found for this chip" as const };
    }

    return { animal: rows[0], error: null };
  }

  return { animal: null, error: "Missing animal reference" as const };
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

    let organizationId: string | null = null;

    try {
      organizationId = await getProfessionalOrgId();
    } catch (error: unknown) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `getProfessionalOrgId failed: ${error.message}`
              : "getProfessionalOrgId failed",
        },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!organizationId) {
      return notFoundResponse();
    }

    const body = (await req.json().catch(() => null)) as AccessRequestBody | null;

    if (!body || typeof body !== "object") {
      return notFoundResponse();
    }

    const animalIdRaw = String(body.animalId ?? body.animal_id ?? "").trim();
    const chipRaw = String(body.chip ?? body.microchip ?? "").trim();

    const requestedScope = normalizeRequestedScope(
      Array.isArray(body.permissions)
        ? body.permissions
        : Array.isArray(body.requestedScope)
          ? body.requestedScope
          : Array.isArray(body.requested_scope)
            ? body.requested_scope
            : []
    );

    if (requestedScope.length === 0) {
      return notFoundResponse();
    }

    const resolved = await resolveAnimalId({
      admin,
      animalIdRaw,
      chipRaw,
    });

    if (resolved.error || !resolved.animal) {
      return NextResponse.json(
        { error: resolved.error || "Animal resolution failed" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const animal = resolved.animal;
    const animalId = animal.id;

    if (!animal.owner_id) {
      return notFoundResponse();
    }

    const existingGrantResult = await admin
      .from("animal_access_grants")
      .select("id, status, revoked_at")
      .eq("animal_id", animalId)
      .eq("grantee_type", "organization")
      .eq("grantee_id", organizationId)
      .eq("status", "active")
      .is("revoked_at", null)
      .limit(10)
      .returns<ExistingGrantRow[]>();

    if (existingGrantResult.error) {
      return NextResponse.json(
        { error: `Grant lookup failed: ${existingGrantResult.error.message}` },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const existingGrants = existingGrantResult.data ?? [];

    if (existingGrants.length > 0) {
      return NextResponse.json(
        {
          ok: true,
          alreadyGranted: true,
          animalId,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const existingRequestResult = await admin
      .from("animal_access_requests")
      .select("id, status")
      .eq("animal_id", animalId)
      .eq("owner_id", animal.owner_id)
      .eq("org_id", organizationId)
      .in("status", ["pending"])
      .limit(10)
      .returns<ExistingRequestRow[]>();

    if (existingRequestResult.error) {
      return NextResponse.json(
        { error: `Existing request lookup failed: ${existingRequestResult.error.message}` },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const existingRequests = existingRequestResult.data ?? [];

    if (existingRequests.length > 0) {
      return NextResponse.json(
        {
          ok: true,
          alreadyPending: true,
          animalId,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const insertResult = await admin
      .from("animal_access_requests")
      .insert({
        animal_id: animalId,
        owner_id: animal.owner_id,
        org_id: organizationId,
        requested_by_user_id: user.id,
        requested_scope: requestedScope,
        status: "pending",
      })
      .select("id")
      .single<{ id: string }>();

    if (insertResult.error || !insertResult.data) {
      return NextResponse.json(
        {
          error: insertResult.error?.message || "Insert request failed",
          details: insertResult.error?.details || null,
          hint: insertResult.error?.hint || null,
          code: insertResult.error?.code || null,
        },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        requestId: insertResult.data.id,
        animalId,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}