import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const animalId = url.searchParams.get("animal_id");

  if (!animalId) {
    return NextResponse.json({ error: "Missing animal_id" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const orgId = await getProfessionalOrgId();
  if (!orgId) return NextResponse.json({ ok: false, reason: "missing_org" });

  const { data, error } = await supabase.rpc("is_grant_active", {
    p_animal: animalId,
    p_org: orgId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: Boolean(data) });
}