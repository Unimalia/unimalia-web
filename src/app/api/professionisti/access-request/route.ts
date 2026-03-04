import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D+/g, "");
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();

  // auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orgId = await getProfessionalOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Missing professional org" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // INPUTS supportati:
  // - animalId (UUID)  ✅ per animali SENZA microchip
  // - microchip (string) per animali CON microchip
  // - scope (default: ["read"])
  const animalIdRaw = body?.animalId ? String(body.animalId) : "";
  const microchipRaw = body?.microchip ? String(body.microchip) : "";
  const scopeRaw = Array.isArray(body?.scope) ? body.scope : ["read"];

  const scope = scopeRaw
    .map((s: any) => String(s))
    .filter((s: string) => ["read", "write", "upload"].includes(s));

  if (scope.length === 0) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  // 1) risolvo animalId:
  //    priorità: animalId valido -> OK
  //    altrimenti: microchip -> lookup su animals.chip_number
  let animalId: string | null = null;

  if (animalIdRaw && isUuid(animalIdRaw)) {
    animalId = animalIdRaw;
  } else if (microchipRaw) {
    const chip = digitsOnly(microchipRaw);
    if (chip.length < 10) {
      return NextResponse.json({ error: "Invalid microchip" }, { status: 400 });
    }

    const { data: a, error: aErr } = await supabase
      .from("animals")
      .select("id")
      .eq("chip_number", chip)
      .maybeSingle();

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
    if (!a?.id) {
      return NextResponse.json(
        { error: "Animal not found (by microchip). If the animal has no microchip, use QR/animalId." },
        { status: 404 }
      );
    }

    animalId = a.id;
  } else {
    return NextResponse.json(
      { error: "Missing animalId or microchip" },
      { status: 400 }
    );
  }

  // 2) verifica che l’animale esista (sempre)
  const { data: animal, error: animalErr } = await supabase
    .from("animals")
    .select("id, owner_id")
    .eq("id", animalId)
    .maybeSingle();

  if (animalErr) return NextResponse.json({ error: animalErr.message }, { status: 500 });
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  // 3) idempotenza: se esiste già una richiesta pending/approved per (animal, org) evito duplicati
  const { data: existing, error: exErr } = await supabase
    .from("animal_access_requests")
    .select("id, status")
    .eq("animal_id", animalId)
    .eq("org_id", orgId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });

  if (existing?.id) {
    return NextResponse.json({ ok: true, requestId: existing.id, status: existing.status });
  }

  // 4) crea richiesta
  const { data: ins, error: insErr } = await supabase
    .from("animal_access_requests")
    .insert({
      animal_id: animalId,
      owner_id: animal.owner_id,
      org_id: orgId,
      requested_scope: scope,
      status: "pending",
    })
    .select("id")
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, requestId: ins.id, status: "pending" });
}