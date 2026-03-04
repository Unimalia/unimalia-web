import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orgId = await getProfessionalOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "missing_org" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const animalId = String(body?.animalId || "").trim();
  const chip = String(body?.chip || body?.microchip || "").trim();

  if (!animalId && !chip) {
    return NextResponse.json({ error: "missing animalId or microchip" }, { status: 400 });
  }

  // 1) risolvo animale
  let animalQ = supabase
    .from("animals")
    .select("id, owner_id, name, species, chip_number")
    .limit(1);

  if (animalId) {
    if (!isUuid(animalId)) return NextResponse.json({ error: "invalid animalId" }, { status: 400 });
    animalQ = animalQ.eq("id", animalId);
  } else {
    animalQ = animalQ.eq("chip_number", chip);
  }

  const { data: animal, error: animalErr } = await animalQ.maybeSingle();
  if (animalErr) return NextResponse.json({ error: animalErr.message }, { status: 500 });
  if (!animal) return NextResponse.json({ error: "animal_not_found" }, { status: 404 });

  // 2) idempotenza soft: se esiste già una request pending per (animal, org) non ne creo un'altra
  const { data: existing, error: exErr } = await supabase
    .from("animal_access_requests")
    .select("id, status")
    .eq("animal_id", animal.id)
    .eq("org_id", orgId)
    .in("status", ["pending", "requested"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });
  if (existing?.id) {
    return NextResponse.json({ ok: true, requestId: existing.id, reused: true });
  }

  // 3) creo request
  const { data: ins, error: insErr } = await supabase
    .from("animal_access_requests")
    .insert({
      animal_id: animal.id,
      owner_id: animal.owner_id,
      org_id: orgId,
      status: "pending",
      requested_scope: ["read"], // MVP: read
      // opzionale se hai colonne:
      // requested_by_user_id: user.id,
    })
    .select("id")
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    requestId: ins.id,
    animal: {
      id: animal.id,
      name: animal.name ?? "",
      species: animal.species ?? null,
      chip_number: animal.chip_number ?? null,
    },
  });
}