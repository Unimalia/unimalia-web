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

  return NextResponse.json({ rows: data ?? [] });
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

  // 2) Approvazione: crea/aggiorna grant + marca request approved
  if (action === "approve") {
    const admin = supabaseAdmin();
    const validTo = computeValidTo(duration);

    // create grant (grantee_type=org)
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

  // 3) Rifiuta: marca request rejected
  if (action === "reject") {
    const { error: updErr } = await supabase
      .from("animal_access_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // 4) Blocca org: per ora (MVP) marca request blocked
  // (poi aggiungiamo una tabella di blocklist org-centrica)
  if (action === "block") {
    const { error: updErr } = await supabase
      .from("animal_access_requests")
      .update({ status: "blocked" })
      .eq("id", id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: "blocked" });
  }

  // 5) Revoca grant (da request già approvata): revoca tutti i grant attivi per (animal_id, org_id)
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

    // opzionale: marca request revoked (se vuoi una traccia “UI”)
    const { error: updErr } = await supabase
      .from("animal_access_requests")
      .update({ status: "revoked" })
      .eq("id", id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: "revoked" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}