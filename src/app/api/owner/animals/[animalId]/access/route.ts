import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ animalId: string }> }
) {
  const { animalId } = await ctx.params;

  if (!animalId || animalId === "undefined") {
    return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: animal, error: animalErr } = await supabase
    .from("animals")
    .select("id, owner_id, name")
    .eq("id", animalId)
    .maybeSingle();

  if (animalErr) {
    return NextResponse.json({ error: animalErr.message }, { status: 500 });
  }

  if (!animal) {
    return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  }

  if (!animal.owner_id) {
    return NextResponse.json({
      requests: [],
      grants: [],
    });
  }

  if (animal.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requestsQ = supabase
    .from("animal_access_requests")
    .select("id, created_at, animal_id, owner_id, org_id, status, requested_scope, expires_at")
    .eq("animal_id", animalId)
    .order("created_at", { ascending: false });

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

  if (reqErr) {
    return NextResponse.json({ error: reqErr.message }, { status: 500 });
  }

  if (grantErr) {
    return NextResponse.json({ error: grantErr.message }, { status: 500 });
  }

  const requestRows = requests ?? [];
  const grantRows = grants ?? [];

  const orgIdsFromRequests = requestRows
    .map((r: any) => r.org_id)
    .filter((v: unknown): v is string => typeof v === "string" && v.length > 0);

  const orgIdsFromGrants = grantRows
    .map((g: any) => g.grantee_id)
    .filter((v: unknown): v is string => typeof v === "string" && v.length > 0);

  const orgIds = Array.from(new Set([...orgIdsFromRequests, ...orgIdsFromGrants]));

  const { data: orgs, error: orgErr } = orgIds.length
    ? await admin
        .from("organizations")
        .select("id, name, display_name, ragione_sociale")
        .in("id", orgIds)
    : { data: [], error: null };

  if (orgErr) {
    return NextResponse.json({ error: orgErr.message }, { status: 500 });
  }

  const orgNameById = new Map<string, string>();

  for (const o of orgs ?? []) {
    orgNameById.set(o.id, o.name ?? o.display_name ?? o.ragione_sociale ?? o.id);
  }

  const enrichedRequests = requestRows.map((r: any) => ({
    ...r,
    animal_name: animal.name ?? animal.id,
    org_name: orgNameById.get(r.org_id) ?? r.org_id,
  }));

  const enrichedGrants = grantRows.map((g: any) => ({
    ...g,
    animal_name: animal.name ?? animal.id,
    org_name: orgNameById.get(g.grantee_id) ?? g.grantee_id,
  }));

  return NextResponse.json({
    requests: enrichedRequests,
    grants: enrichedGrants,
  });
}