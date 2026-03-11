import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AnimalPayload = {
  name?: string;
  species?: string;
  breed?: string | null;
  color?: string | null;
  size?: string | null;
  birth_date?: string | null;
  microchip?: string | null;
  chip_number?: string | null; // compat legacy
  photo_url?: string | null;
  sex?: string | null;
};

function normalizeMicrochip(value?: string | null) {
  const digits = String(value ?? "").replace(/\D+/g, "").trim();
  return digits.length ? digits : null;
}

function isValidMicrochip(value: string) {
  return /^\d{15}$/.test(value);
}

async function getProfessionalOrgId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const byUserId = await supabase
    .from("professional_profiles")
    .select("org_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUserId.data?.org_id) {
    return byUserId.data.org_id as string;
  }

  const byId = await supabase
    .from("professional_profiles")
    .select("org_id")
    .eq("id", userId)
    .maybeSingle();

  if (byId.data?.org_id) {
    return byId.data.org_id as string;
  }

  console.error("[PROF_ORG_NOT_FOUND]", {
    userId,
    byUserIdError: byUserId.error,
    byIdError: byId.error,
  });

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const orgId = await getProfessionalOrgId(supabase, user.id);

    if (!orgId) {
      return NextResponse.json(
        { error: "Profilo professionista non valido o organizzazione non trovata" },
        { status: 403 }
      );
    }

    const animalId = req.nextUrl.searchParams.get("animalId");

    if (!animalId) {
      return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
    }

    const { data: animal, error: animalError } = await supabase
      .from("animals")
      .select(`
        id,
        name,
        species,
        breed,
        color,
        size,
        sex,
        birth_date,
        microchip,
        unimalia_code,
        photo_url,
        owner_id,
        owner_claim_status,
        owner_claimed_at,
        created_by_role,
        created_by_org_id,
        origin_org_id,
        microchip_verified_by_label
      `)
      .eq("id", animalId)
      .single();

    if (animalError || !animal) {
      return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
    }

    const { data: grant } = await supabase
      .from("animal_access_grants")
      .select("id")
      .eq("animal_id", animalId)
      .eq("grantee_id", orgId)
      .eq("status", "active")
      .maybeSingle();

    const canAccess =
      !!grant ||
      animal.created_by_org_id === orgId ||
      animal.origin_org_id === orgId;

    if (!canAccess) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    return NextResponse.json({ animal });
  } catch (error: any) {
    console.error("[PROF_ANIMAL_GET]", error);
    return NextResponse.json(
      { error: error?.message || "Errore interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const orgId = await getProfessionalOrgId(supabase, user.id);

    if (!orgId) {
      return NextResponse.json(
        { error: "Profilo professionista non valido o organizzazione non trovata" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as AnimalPayload;

    const name = body.name?.trim() ?? "";
    const species = body.species?.trim() ?? "";
    const microchip = normalizeMicrochip(body.microchip ?? body.chip_number ?? null);

    if (!name) {
      return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
    }

    if (!species) {
      return NextResponse.json({ error: "Specie obbligatoria" }, { status: 400 });
    }

    if (microchip && !isValidMicrochip(microchip)) {
      return NextResponse.json(
        { error: "Microchip non valido: servono 15 cifre" },
        { status: 400 }
      );
    }

    if (microchip) {
      const { data: existingChip, error: chipCheckError } = await supabase
        .from("animals")
        .select("id")
        .eq("microchip", microchip)
        .maybeSingle();

      if (chipCheckError) {
        console.error("[PROF_ANIMAL_POST_CHIP_CHECK]", chipCheckError);
      }

      if (existingChip?.id) {
        return NextResponse.json(
          {
            error: "Esiste già un animale con questo microchip",
            existingAnimalId: existingChip.id,
          },
          { status: 409 }
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
      birth_date: body.birth_date || null,
      microchip,
      photo_url: body.photo_url || null,
      owner_id: null,
      created_by_role: "professional",
      created_by_org_id: orgId,
      origin_org_id: orgId,
      owner_claim_status: "pending",
    };

    const { data: created, error: createError } = await supabase
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
        birth_date,
        microchip,
        unimalia_code,
        photo_url,
        owner_id,
        owner_claim_status,
        owner_claimed_at,
        created_by_role,
        created_by_org_id,
        origin_org_id,
        microchip_verified_by_label
      `)
      .single();

    if (createError) {
      console.error("[PROF_ANIMAL_POST_CREATE]", createError);
      return NextResponse.json(
        {
          error: createError.message || "Errore creazione animale",
          details: createError.details || null,
          hint: createError.hint || null,
          code: createError.code || null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ animal: created }, { status: 201 });
  } catch (error: any) {
    console.error("[PROF_ANIMAL_POST]", error);
    return NextResponse.json(
      { error: error?.message || "Errore interno" },
      { status: 500 }
    );
  }
}