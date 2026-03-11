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

  // 1) accesso consentito se:
  // - esiste grant attivo
  // - oppure l'animale è stato creato dalla stessa org
  // - oppure l'org di origine coincide con la org corrente

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

  if (grantErr) {
    return NextResponse.json({ error: grantErr.message }, { status: 500 });
  }

  const { data: ownershipAnimal, error: ownershipErr } = await admin
    .from("animals")
    .select("id, created_by_org_id, origin_org_id")
    .eq("id", animalId)
    .single();

  if (ownershipErr) {
    return NextResponse.json({ error: ownershipErr.message }, { status: 500 });
  }

  const hasGrant = !!grants && grants.length > 0;
  const belongsToCurrentOrg =
    ownershipAnimal?.created_by_org_id === orgId ||
    ownershipAnimal?.origin_org_id === orgId;

  if (!hasGrant && !belongsToCurrentOrg) {
    return NextResponse.json(
      { error: "No active grant for this animal" },
      { status: 403 }
    );
  }

  // 2) carica animale (admin)
  const { data: animal, error: aErr } = await admin
    .from("animals")
    .select(
      "id,owner_id,created_at,name,species,breed,color,size,chip_number,microchip_verified,status,unimalia_code,photo_url,microchip_verified_at,microchip_verified_org_id,birth_date,birth_date_is_estimated"
    )
    .eq("id", animalId)
    .single();

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
  if (!animal) return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });

  return NextResponse.json({ ok: true, animal });
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const orgId = await getProfessionalOrgId();

    if (!orgId) {
      return NextResponse.json(
        { error: "Nessuna organizzazione professionale collegata a questo account." },
        { status: 400 }
      );
    }

    const { data: orgRow, error: orgErr } = await admin
      .from("organizations")
      .select("id, name")
      .eq("id", orgId)
      .maybeSingle();

    if (orgErr) {
      return NextResponse.json({ error: orgErr.message }, { status: 500 });
    }

    if (!orgRow) {
      return NextResponse.json(
        {
          error:
            "Organizzazione professionale non trovata. Verifica il collegamento tra professional_profiles e organizations.",
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);

    const name = String(body?.name ?? "").trim();
    const species = String(body?.species ?? "").trim();
    const chip = String(body?.chip_number ?? "").replace(/\D+/g, "");

    if (name.length < 2) {
      return NextResponse.json({ error: "Nome animale non valido" }, { status: 400 });
    }

    if (species.length < 2) {
      return NextResponse.json({ error: "Specie non valida" }, { status: 400 });
    }

    if (chip && chip.length !== 15 && chip.length !== 10) {
      return NextResponse.json(
        { error: "Microchip non valido: attese 15 cifre, opzionale 10." },
        { status: 400 }
      );
    }

    const payload = {
      owner_id: null,
      name,
      species,
      breed: body?.breed ?? null,
      color: body?.color ?? null,
      size: body?.size ?? null,
      chip_number: chip || null,
      status: "active",

      created_by_role: "professional",
      created_by_org_id: orgId,
      origin_org_id: orgId,
      data_trust_level: "professional",

      owner_claim_status: "pending",
      owner_claimed_at: null,

      microchip_verified: false,
      birth_date: body?.birth_date ?? null,
      birth_date_is_estimated: false,
    };

    const { data: animal, error: insertErr } = await admin
      .from("animals")
      .insert(payload)
      .select("id,name,species,chip_number")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, animal });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}