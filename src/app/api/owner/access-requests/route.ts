import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  if (error) {
    // IMPORTANT: se qui vedi "permission denied", è RLS.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data ?? [] });
}