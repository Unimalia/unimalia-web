import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const animalId = String(url.searchParams.get("animalId") ?? "").trim();

  if (!animalId || !isUuid(animalId)) {
    return NextResponse.json({ error: "Missing/invalid animalId" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const admin = supabaseAdmin();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const orgId = await getProfessionalOrgId();
  if (!orgId) return NextResponse.json({ error: "Missing org" }, { status: 400 });

  // 1) check grant attivo (org -> animal)
  const nowIso = new Date().toISOString();
  const { data: grants, error: grantErr } = await admin
    .from("animal_access_grants")
    .select("id")
    .eq("animal_id", animalId)
    .eq("grantee_type", "org")
    .eq("grantee_id", orgId)
    .eq("status", "active")
    .is("revoked_at", null)
    .or(`valid_to.is.null,valid_to.gt.${nowIso}`)
    .limit(1);

  if (grantErr) return NextResponse.json({ error: grantErr.message }, { status: 500 });

  if (!grants || grants.length === 0) {
    return NextResponse.json({ error: "No active grant for this animal" }, { status: 403 });
  }

  // 2) carica animale (admin)
  const { data: animal, error: aErr } = await admin
    .from("animals")
    .select(
      "id,owner_id,created_at,name,species,breed,color,size,chip_number,microchip_verified,status,unimalia_code,photo_url,microchip_verified_at,microchip_verified_org_id"
    )
    .eq("id", animalId)
    .single();

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
  if (!animal) return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });

  return NextResponse.json({ ok: true, animal });
}