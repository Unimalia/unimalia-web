import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

// Cache in-memory (per non fare tentativi ad ogni request)
type RequestsKeyMode = "org_id" | "requester" | "grantee";
let REQUESTS_KEY_MODE: RequestsKeyMode | null = null;

async function detectRequestsKeyMode(
  admin: ReturnType<typeof supabaseAdmin>
): Promise<RequestsKeyMode> {
  if (REQUESTS_KEY_MODE) return REQUESTS_KEY_MODE;

  // 1) prova org_id
  {
    const { error } = await admin.from("animal_access_requests").select("org_id").limit(1);
    if (!error) return (REQUESTS_KEY_MODE = "org_id");
    if (!String(error.message || "").toLowerCase().includes("does not exist")) {
      // errore diverso → non forziamo fallback, lo lasciamo emergere
      throw error;
    }
  }

  // 2) prova requester_type/requester_id
  {
    const { error } = await admin.from("animal_access_requests").select("requester_type,requester_id").limit(1);
    if (!error) return (REQUESTS_KEY_MODE = "requester");
    if (!String(error.message || "").toLowerCase().includes("does not exist")) {
      throw error;
    }
  }

  // 3) prova grantee_type/grantee_id
  {
    const { error } = await admin.from("animal_access_requests").select("grantee_type,grantee_id").limit(1);
    if (!error) return (REQUESTS_KEY_MODE = "grantee");
    if (!String(error.message || "").toLowerCase().includes("does not exist")) {
      throw error;
    }
  }

  // Se siamo qui, la tabella esiste ma nessuna delle chiavi previste esiste
  // → schema incoerente
  throw new Error(
    "animal_access_requests: non trovo colonne org_id né requester_* né grantee_*. Controlla schema tabella."
  );
}

function pickString(body: any, keys: string[]) {
  for (const k of keys) {
    const v = body?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
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

  const body = await req.json().catch(() => ({}));

  // Accetta tutte le varianti possibili dal client
  const animalIdRaw = pickString(body, ["animalId", "animal_id", "id"]);
  const microchipRaw = pickString(body, ["microchip", "chip", "chip_number"]);

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

  // 3) Se esiste già una richiesta pending, non duplicare
  let existingReq: any = null;

  try {
    const keyMode = await detectRequestsKeyMode(admin);

    let q = admin
      .from("animal_access_requests")
      .select("id, status, created_at")
      .eq("animal_id", animal.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (keyMode === "org_id") {
      q = q.eq("org_id", orgId);
    } else if (keyMode === "requester") {
      q = q.eq("requester_type", "org").eq("requester_id", orgId);
    } else {
      q = q.eq("grantee_type", "org").eq("grantee_id", orgId);
    }

    const { data, error } = await q.maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    existingReq = data;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Schema animal_access_requests non compatibile" }, { status: 500 });
  }

  if (existingReq?.id) {
    return NextResponse.json({
      ok: true,
      alreadyRequested: true,
      requestId: existingReq.id,
      animal: { id: animal.id, name: animal.name, species: animal.species, owner_id: animal.owner_id },
    });
  }

  // 4) Crea richiesta
  const requested_scope = Array.isArray(body?.requested_scope)
    ? body.requested_scope
    : Array.isArray(body?.requestedScope)
      ? body.requestedScope
      : ["read"];

  try {
    const keyMode = await detectRequestsKeyMode(admin);

    let payload: any = {
      animal_id: animal.id,
      owner_id: animal.owner_id,
      status: "pending",
      requested_scope,
    };

    if (keyMode === "org_id") {
      payload.org_id = orgId;
    } else if (keyMode === "requester") {
      payload.requester_type = "org";
      payload.requester_id = orgId;
    } else {
      payload.grantee_type = "org";
      payload.grantee_id = orgId;
    }

    const { data: inserted, error: insErr } = await admin
      .from("animal_access_requests")
      .insert(payload)
      .select("id, status, created_at")
      .single();

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      request: inserted,
      animal: { id: animal.id, name: animal.name, species: animal.species, owner_id: animal.owner_id },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Schema animal_access_requests non compatibile" }, { status: 500 });
  }
}