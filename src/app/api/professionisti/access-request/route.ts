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
      .single<AnimalLookupRow>();

    if (animalResult.error || !animalResult.data) {
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
      return { animal: null, error: "Animal lookup failed" as const };
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

    let orgId: string | null = null;

    try {
      orgId = await getProfessionalOrgId();
    } catch {
      orgId = null;
    }

    if (!orgId) {
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
      return notFoundResponse();
    }

    const animal = resolved.animal;
    const animalId = animal.id;

    if (!animal.owner_id) {
      return notFoundResponse();
    }

    const existingGrant = await admin
      .from("animal_access_grants")
      .select("id, status, revoked_at")
      .eq("animal_id", animalId)
      .eq("grantee_type", "organization")
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
          animalId,
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
        org_id: orgId,
        requested_by: user.id,
        requested_scope: requestedScope,
        status: "pending",
      })
      .select("id")
      .single<{ id: string }>();

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
        animalId,
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