import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const action = String(body?.action || "");
  const duration = body?.duration ? String(body.duration) : null;

  if (!id) return bad("Missing id");

  if (action === "reject") {
    const { error } = await supabase
      .from("animal_access_requests")
      .update({ status: "rejected", decided_at: new Date().toISOString(), decided_by: user.id })
      .eq("id", id);

    if (error) return bad(error.message, 500);
    return NextResponse.json({ status: "rejected" });
  }

  if (action === "block") {
    const { data: r, error: rErr } = await supabase
      .from("animal_access_requests")
      .select("org_id")
      .eq("id", id)
      .maybeSingle();

    if (rErr) return bad(rErr.message, 500);
    if (!r?.org_id) return bad("Request not found", 404);

    const { error: bErr } = await supabase
      .from("owner_org_blocks")
      .insert({ owner_id: user.id, org_id: r.org_id, blocked_by: user.id });

    if (bErr) return bad(bErr.message, 500);

    const { error: uErr } = await supabase
      .from("animal_access_requests")
      .update({ status: "blocked", decided_at: new Date().toISOString(), decided_by: user.id })
      .eq("id", id);

    if (uErr) return bad(uErr.message, 500);
    return NextResponse.json({ status: "blocked" });
  }

  if (action === "approve") {
    if (!duration) return bad("Missing duration");

    const { data: r, error: rErr } = await supabase
      .from("animal_access_requests")
      .select("requested_scope")
      .eq("id", id)
      .maybeSingle();

    if (rErr) return bad(rErr.message, 500);
    const scopes = (r?.requested_scope ?? ["read"]) as string[];

    const { error } = await supabase.rpc("approve_access_request", {
      p_request_id: id,
      p_duration: duration,
      p_scopes: scopes,
    });

    if (error) return bad(error.message, 500);
    return NextResponse.json({ status: "approved" });
  }

  return bad("Invalid action");
}