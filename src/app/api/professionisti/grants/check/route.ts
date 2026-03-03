import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const animalId = url.searchParams.get("animal_id");

  if (!animalId) {
    return NextResponse.json({ ok: false, error: "Missing animal_id" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) return NextResponse.json({ ok: false, error: authErr.message }, { status: 401 });
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const orgId = await getProfessionalOrgId();
  if (!orgId) {
    // richiesta riuscita ma nessuna org -> nessun grant
    return NextResponse.json({ ok: false, hasGrant: false, reason: "missing_org" });
  }

  const { data, error } = await supabase.rpc("is_grant_active", {
    p_animal: animalId,
    p_org: orgId,
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const hasGrant = Boolean(data);

  // ✅ compatibilità:
  // - ok = grant attivo (come prima, così lo scanner “vecchio” funziona)
  // - hasGrant = esplicito (così lo scanner “nuovo” funziona)
  return NextResponse.json({
    ok: hasGrant,
    hasGrant,
    orgId,
    animalId,
  });
}