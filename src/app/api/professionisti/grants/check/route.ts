import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const animalId = (url.searchParams.get("animal_id") || "").trim();

  if (!animalId) {
    return NextResponse.json(
      { ok: false, error: "Missing animal_id" },
      { status: 400 }
    );
  }

  if (!isUuid(animalId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid animal_id" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) {
    return NextResponse.json(
      { ok: false, error: authErr.message },
      { status: 401 }
    );
  }

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const orgId = await getProfessionalOrgId();
  if (!orgId) {
    return NextResponse.json(
      { ok: false, hasGrant: false, reason: "missing_org" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase.rpc("is_grant_active", {
    p_animal: animalId,
    p_org: orgId,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const hasGrant = Boolean(data);

  return NextResponse.json({
    ok: hasGrant,
    hasGrant,
  });
}