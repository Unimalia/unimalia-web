import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

type AnimalPayload = {
  name?: string;
  species?: string;
  breed?: string | null;
  color?: string | null;
  size?: string | null;
  sex?: string | null;
  sterilized?: boolean | null;
  birth_date?: string | null;
  microchip?: string | null;
  chip_number?: string | null;
  photo_url?: string | null;
};

function normalizeChip(value?: string | null) {
  const digits = String(value ?? "").replace(/\D+/g, "").trim();
  return digits.length ? digits : null;
}

function isValidChip(value: string) {
  return /^\d{15}$/.test(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function getProfessionalRefs(userId: string) {
  const admin = supabaseAdmin();
  const refs = new Set<string>();
  refs.add(userId);

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.data?.org_id) {
    refs.add(profileResult.data.org_id);
  }

  return Array.from(refs).filter(Boolean);
}

async function getProfessionalOrgId(userId: string) {
  const admin = supabaseAdmin();

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.data?.org_id) {
    return {
      orgId: profileResult.data.org_id as string,
      profile: profileResult.data,
    };
  }

  return {
    orgId: null,
    profile: null,
    error: profileResult.error
      ? {
          message: profileResult.error.message,
          details: profileResult.error.details,
          hint: profileResult.error.hint,
          code: profileResult.error.code,
        }
      : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const orgLookup = await getProfessionalOrgId(user.id);
    const refs = await getProfessionalRefs(user.id);

    if (!orgLookup.orgId) {
      return NextResponse.json(
        { error: "Profilo professionista non valido o organizzazione non trovata" },
        { status: 403 }
      );
    }

    const animalId = (req.nextUrl.searchParams.get("animalId") || "").trim();

    if (!animalId) {
      return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
    }

    if (!isUuid(animalId)) {
      return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
    }

    const animalResult = await admin
      .from("animals")
      .select(`
        id,
        name,
        species,
        breed,
        color,
        size,
        sex,
        sterilized,
        birth_date,
        chip_number,
        unimalia_code,
        photo_url,
        owner_id,
        owner_claim_status,
        owner_claimed_at,
        created_by_role,
        created_by_org_id,
        origin_org_id
      `)
      .eq("id", animalId)
      .single();

    if (animalResult.error || !animalResult.data) {
      return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
    }

    const animal = animalResult.data;

    const grantResult = await admin
      .from("animal_access_grants")
      .select("id, grantee_id, status")
      .eq("animal_id", animalId)
      .in("grantee_id", refs)
      .in("status", ["active", "approved"]);

    const hasGrant = (grantResult.data?.length ?? 0) > 0;

    const canAccess =
      hasGrant ||
      refs.includes(animal.created_by_org_id ?? "") ||
      refs.includes(animal.origin_org_id ?? "");

    if (!canAccess) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    return NextResponse.json({
      animal: {
        ...animal,
        microchip: animal.chip_number ?? null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const orgLookup = await getProfessionalOrgId(user.id);

    if (!orgLookup.orgId) {
      return NextResponse.json(
        { error: "Profilo professionista non valido o organizzazione non trovata" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as AnimalPayload;

    const name = body.name?.trim() ?? "";
    const species = body.species?.trim() ?? "";
    const chipNumber = normalizeChip(body.microchip ?? body.chip_number ?? null);

    if (!name) {
      return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
    }

    if (!species) {
      return NextResponse.json({ error: "Specie obbligatoria" }, { status: 400 });
    }

    if (chipNumber && !isValidChip(chipNumber)) {
      return NextResponse.json(
        { error: "Microchip non valido: servono 15 cifre" },
        { status: 400 }
      );
    }

    if (chipNumber) {
      const chipCheck = await admin
        .from("animals")
        .select("id, name, chip_number")
        .eq("chip_number", chipNumber)
        .maybeSingle();

      if (chipCheck.data?.id) {
        return NextResponse.json(
          { error: "Esiste già un animale con questo microchip" },
          { status: 409 }
        );
      }

      if (chipCheck.error) {
        return NextResponse.json(
          { error: "Errore controllo microchip" },
          { status: 500 }
        );
      }
    }

    const insertPayload = {
      name,
      species,
      breed: body.breed?.trim() || null,
      color: body.color?.trim() || null,
      size: body.size?.trim() || null,
      sex: body.sex?.trim() || null,
      sterilized:
        typeof body.sterilized === "boolean" ? body.sterilized : null,
      birth_date: body.birth_date || null,
      chip_number: chipNumber,
      photo_url: body.photo_url || null,
      owner_id: null,
      created_by_role: "professional",
      created_by_org_id: orgLookup.orgId,
      origin_org_id: orgLookup.orgId,
      owner_claim_status: "pending",
    };

    const created = await admin
      .from("animals")
      .insert(insertPayload)
      .select(`
        id,
        name,
        species,
        breed,
        color,
        size,
        sex,
        sterilized,
        birth_date,
        chip_number,
        unimalia_code,
        photo_url,
        owner_id,
        owner_claim_status,
        owner_claimed_at,
        created_by_role,
        created_by_org_id,
        origin_org_id
      `)
      .single();

    if (created.error || !created.data) {
      return NextResponse.json(
        { error: created.error?.message || "Errore creazione animale" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        animal: {
          ...created.data,
          microchip: created.data.chip_number ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore interno" },
      { status: 500 }
    );
  }
}