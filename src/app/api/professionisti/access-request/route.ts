import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => null);
  const animalIdRaw = String(body?.animalId ?? "").trim();
  const microchipRaw = String(body?.microchip ?? "").trim();

  const animalId = animalIdRaw && isUuid(animalIdRaw) ? animalIdRaw : "";
  const chip = digitsOnly(microchipRaw);

  if (!animalId && !chip) {
    return NextResponse.json({ error: "Missing animalId or microchip" }, { status: 400 });
  }

  // 1) Risolvi animale (PRIORITÀ: animalId, poi microchip)
  let animal: any = null;

  if (animalId) {
    const { data, error } = await admin
      .from("animals")
      .select("id, name, species, owner_id, chip_number")
      .eq("id", animalId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });

    animal = data;
  } else {
    // fallback microchip: usa SEMPRE chip_number (non microchip)
    const { data, error } = await admin
      .from("animals")
      .select("id, name, species, owner_id, chip_number")
      .eq("chip_number", chip)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });

    animal = data;
  }

  // 2) Se c'è già un grant attivo per questa org, non creare richiesta
  const nowIso = new Date().toISOString();
  const { data: activeGrants, error: grantErr } = await admin
    .from("animal_access_grants")
    .select("id, status, revoked_at, valid_to")
    .eq("animal_id", animal.id)
    .eq("grantee_type", "org")
    .eq("grantee_id", orgId)
    .eq("status", "active")
    .is("revoked_at", null)
    .or(`valid_to.is.null,valid_to.gt.${nowIso}`)
    .limit(1);

  if (grantErr) return NextResponse.json({ error: grantErr.message }, { status: 500 });

  if ((activeGrants ?? []).length > 0) {
    return NextResponse.json({
      ok: true,
      alreadyGranted: true,
      animal: { id: animal.id, name: animal.name, species: animal.species, owner_id: animal.owner_id },
    });
  }

  // 3) Se esiste già una richiesta pending per (animal, org), non duplicare
  const { data: existingReq, error: existingErr } = await admin
    .from("animal_access_requests")
    .select("id, status, created_at")
    .eq("animal_id", animal.id)
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });

  if (existingReq?.id) {
    return NextResponse.json({
      ok: true,
      alreadyRequested: true,
      requestId: existingReq.id,
      animal: { id: animal.id, name: animal.name, species: animal.species, owner_id: animal.owner_id },
    });
  }

  // 4) Crea richiesta
  const requested_scope = Array.isArray(body?.requested_scope) ? body.requested_scope : ["read"];

  const { data: inserted, error: insErr } = await admin
    .from("animal_access_requests")
    .insert({
      animal_id: animal.id,
      owner_id: animal.owner_id,
      org_id: orgId,
      status: "pending",
      requested_scope,
    })
    .select("id, status, created_at")
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    request: inserted,
    animal: { id: animal.id, name: animal.name, species: animal.species, owner_id: animal.owner_id },
  });
}