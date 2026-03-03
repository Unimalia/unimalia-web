import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad("Not authenticated", 401);

  const orgId = await getProfessionalOrgId();
  if (!orgId) return bad("Missing org");

  const body = await req.json().catch(() => null);
  const microchipOrCode = String(body?.microchipOrCode || "").trim();
  const scope = Array.isArray(body?.scope) ? body.scope.map(String) : ["read"];

  if (!microchipOrCode) return bad("Missing microchipOrCode");
  if (scope.length === 0) return bad("Missing scope");

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      microchipOrCode
    );

  let animal: any = null;

  if (isUuid) {
    const { data, error } = await supabase
      .from("animals")
      .select("id, owner_id")
      .eq("id", microchipOrCode)
      .maybeSingle();
    if (error) return bad(error.message, 500);
    animal = data;
  } else {
    const { data, error } = await supabase
      .from("animals")
      .select("id, owner_id")
      .eq("microchip", microchipOrCode)
      .maybeSingle();
    if (error) return bad(error.message, 500);
    animal = data;
  }

  if (!animal?.id || !animal?.owner_id) return bad("Animal not found");

  const { data: inserted, error: insErr } = await supabase
    .from("animal_access_requests")
    .insert({
      animal_id: animal.id,
      owner_id: animal.owner_id,
      org_id: orgId,
      requested_by: user.id,
      requested_scope: scope,
      status: "pending",
    })
    .select("id, created_at, animal_id, owner_id, org_id, status, requested_scope, expires_at")
    .single();

  if (insErr) {
    const msg = (insErr.message || "").toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      const { data: existing } = await supabase
        .from("animal_access_requests")
        .select("id, created_at, animal_id, owner_id, org_id, status, requested_scope, expires_at")
        .eq("animal_id", animal.id)
        .eq("org_id", orgId)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) return NextResponse.json({ request: existing });
      return bad("Request already exists", 409);
    }
    return bad(insErr.message, 500);
  }

  return NextResponse.json({ request: inserted });
}