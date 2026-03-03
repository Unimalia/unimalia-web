import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

type Action = "approve" | "reject" | "block" | "revoke";
type Duration = "24h" | "7d" | "6m" | "forever";

function computeValidTo(duration: Duration) {
  const now = new Date();
  if (duration === "forever") return null;

  if (duration === "24h") now.setHours(now.getHours() + 24);
  if (duration === "7d") now.setDate(now.getDate() + 7);
  if (duration === "6m") now.setMonth(now.getMonth() + 6);

  return now.toISOString();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const animalId = url.searchParams.get("animalId");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let q = supabase
    .from("animal_access_requests")
    .select("id, created_at, animal_id, owner_id, org_id, status, requested_scope, expires_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (animalId) q = q.eq("animal_id", animalId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  const animalIds = Array.from(new Set(rows.map((r: any) => r.animal_id).filter(Boolean)));
  const orgIds = Array.from(new Set(rows.map((r: any) => r.org_id).filter(Boolean)));

  const admin = supabaseAdmin();

  const [{ data: animals }, { data: orgs }] = await Promise.all([
    animalIds.length
      ? admin.from("animals").select("id, name").in("id", animalIds)
      : Promise.resolve({ data: [] as any[] }),
    orgIds.length
      ? admin
          .from("organizations")
          .select("id, name, display_name, ragione_sociale")
          .in("id", orgIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const animalNameById = new Map<string, string>();
  for (const a of animals ?? []) animalNameById.set(a.id, a.name ?? a.id);

  const orgNameById = new Map<string, string>();
  for (const o of orgs ?? []) {
    orgNameById.set(o.id, o.name ?? o.display_name ?? o.ragione_sociale ?? o.id);
  }

  const enriched = rows.map((r: any) => ({
    ...r,
    animal_name: animalNameById.get(r.animal_id) ?? r.animal_id,
    org_name: orgNameById.get(r.org_id) ?? r.org_id,
  }));

  return NextResponse.json({ rows: enriched });
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.action) {
    return NextResponse.json({ error: "Missing id/action" }, { status: 400 });
  }

  const id = String(body.id);
  const action = String(body.action) as Action;
  const duration = (body.duration ? String(body.duration) : "24h") as Duration;

  // 1) Carica request e verifica owner
  const { data: reqRow, error: reqErr } = await supabase
    .from("animal_access_requests")
    .select("id, animal_id, owner_id, org_id, status, requested_scope")
    .eq("id", id)
    .maybeSingle();

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });
  if (!reqRow) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (reqRow.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2) Approvazione: crea grant + marca request approved
  if (action === "approve") {
    const admin = supabaseAdmin();
    const validTo = computeValidTo(duration);

    const { error: grantErr } = await admin.from("animal_access_grants").insert({
      animal_id: reqRow.animal_id,
      granted_by_user_id: user.id,
      grantee_type: "org",
      grantee_id: reqRow.org_id,
      scope_read: (reqRow.requested_scope ?? []).includes("read"),
      scope_write: (reqRow.requested_scope ?? []).includes("write"),
      scope_upload: (reqRow.requested_scope ?? []).includes("upload"),
      purpose: "owner_approved_request",
      valid_from: new Date().toISOString(),
      valid_to: validTo,
      status: "active",
    });

    if (grantErr) return NextResponse.json({ error: grantErr.message }, { status: 500 });

    const { error: updErr } = await supabase
      .from("animal_access_requests")
      .update({
        status: "approved",
        expires_at: validTo,
      })
      .eq("id", id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: "approved" });
  }

  // 3) Rifiuta
  if (action === "reject") {
    const { error: updErr } = await supabase
      .from("animal_access_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // 4) Blocca (MVP)
  if (action === "block") {
    const { error: updErr } = await supabase
      .from("animal_access_requests")
      .update({ status: "blocked" })
      .eq("id", id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: "blocked" });
  }

  // 5) Revoca grant
  if (action === "revoke") {
    const admin = supabaseAdmin();

    const { error: revErr } = await admin
      .from("animal_access_grants")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by_user_id: user.id,
        status: "revoked",
      })
      .eq("animal_id", reqRow.animal_id)
      .eq("grantee_type", "org")
      .eq("grantee_id", reqRow.org_id)
      .is("revoked_at", null);

    if (revErr) return NextResponse.json({ error: revErr.message }, { status: 500 });

    const { error: updErr } = await supabase
      .from("animal_access_requests")
      .update({ status: "revoked" })
      .eq("id", id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: "revoked" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}