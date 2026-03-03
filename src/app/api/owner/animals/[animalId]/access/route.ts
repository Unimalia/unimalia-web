import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ animalId: string }> }
) {
  const { animalId } = await ctx.params;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Verifica owner animale
  const { data: animal, error: animalErr } = await supabase
    .from("animals")
    .select("id, owner_id")
    .eq("id", animalId)
    .maybeSingle();

  if (animalErr) return NextResponse.json({ error: animalErr.message }, { status: 500 });
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  if (animal.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Requests (coerenti con access-requests/route.ts)
  const requestsQ = supabase
    .from("animal_access_requests")
    .select("id, created_at, animal_id, owner_id, org_id, status, requested_scope, expires_at")
    .eq("animal_id", animalId)
    .order("created_at", { ascending: false });

  // Grants (admin)
  const admin = supabaseAdmin();
  const grantsQ = admin
    .from("animal_access_grants")
    .select(
      "id, created_at, animal_id, grantee_type, grantee_id, status, valid_to, revoked_at, scope_read, scope_write, scope_upload"
    )
    .eq("animal_id", animalId)
    .order("created_at", { ascending: false });

  const [{ data: requests, error: reqErr }, { data: grants, error: grantErr }] =
    await Promise.all([requestsQ, grantsQ]);

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });
  if (grantErr) return NextResponse.json({ error: grantErr.message }, { status: 500 });

  return NextResponse.json({
    requests: requests ?? [],
    grants: grants ?? [],
  });
}