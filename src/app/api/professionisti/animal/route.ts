import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

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

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

function normalizeAnimalRef(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^unimalia[:\-]/i.test(raw)) {
    return raw.replace(/^unimalia[:\-]/i, "").trim();
  }

  return raw;
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

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (profileResult.data?.org_id) {
    refs.add(profileResult.data.org_id);
  }

  const professionalResult = await admin
    .from("professionals")
    .select("id, owner_id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (professionalResult.error) {
    throw professionalResult.error;
  }

  if (professionalResult.data?.id) {
    refs.add(professionalResult.data.id);
  }

  return Array.from(refs).filter(Boolean);
}

async function resolveAnimalByRef(animalRef: string) {
  const admin = supabaseAdmin();
  const ref = normalizeAnimalRef(animalRef);

  if (!ref) {
    return {
      data: null,
      error: { message: "animalId mancante" },
    };
  }

  if (isUuid(ref)) {
    const byId = await admin
      .from("animals")
      .select("*")
      .eq("id", ref)
      .maybeSingle();

    if (byId.error) return byId;
    if (byId.data) return byId;
  }

  const chip = digitsOnly(ref);
  if (chip.length === 15 || chip.length === 10) {
    const byChip = await admin
      .from("animals")
      .select("*")
      .eq("chip_number", chip)
      .maybeSingle();

    if (byChip.error) return byChip;
    if (byChip.data) return byChip;
  }

  const byCode = await admin
    .from("animals")
    .select("*")
    .eq("unimalia_code", ref)
    .maybeSingle();

  return byCode;
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

    const refs = await getProfessionalRefs(user.id);

    if (refs.length === 0) {
      return NextResponse.json(
        { error: "Profilo professionista non valido o organizzazione non trovata" },
        { status: 403 }
      );
    }

    const animalRef =
      (req.nextUrl.searchParams.get("animalId") || "").trim() ||
      (req.nextUrl.searchParams.get("id") || "").trim() ||
      (req.nextUrl.searchParams.get("q") || "").trim();

    if (!animalRef) {
      return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
    }

    const animalResult = await resolveAnimalByRef(animalRef);

    if (animalResult.error) {
      return NextResponse.json(
        { error: animalResult.error.message || "Errore lookup animale" },
        { status: 500 }
      );
    }

    if (!animalResult.data) {
      return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
    }

    const animal = animalResult.data as Record<string, any>;

    const grantResult = await admin
      .from("animal_access_grants")
      .select("id, grantee_id, status, valid_to, revoked_at, scope_read, scope_write")
      .eq("animal_id", animal.id)
      .eq("grantee_type", "org")
      .in("grantee_id", refs)
      .is("revoked_at", null);

    if (grantResult.error) {
      return NextResponse.json(
        { error: grantResult.error.message || "Errore verifica grant" },
        { status: 500 }
      );
    }

    const now = Date.now();

    const activeGrant =
      (grantResult.data ?? []).find((g: any) => {
        if (g.status !== "active" && g.status !== "approved") return false;
        if (!g.scope_read && !g.scope_write) return false;
        if (!g.valid_to) return true;

        const validToMs = new Date(g.valid_to).getTime();
        if (Number.isNaN(validToMs)) return true;

        return validToMs > now;
      }) ?? null;

    const hasGrant = Boolean(activeGrant);

    const canAccess =
      hasGrant ||
      refs.includes(String(animal.created_by_org_id ?? "")) ||
      refs.includes(String(animal.origin_org_id ?? ""));

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

    const orgId = await getProfessionalOrgId();

    if (!orgId) {
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
          { error: chipCheck.error.message || "Errore controllo microchip" },
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
      sterilized: typeof body.sterilized === "boolean" ? body.sterilized : null,
      birth_date: body.birth_date || null,
      chip_number: chipNumber,
      photo_url: body.photo_url || null,
      owner_id: null,
      created_by_role: "professional",
      created_by_org_id: orgId,
      origin_org_id: orgId,
      owner_claim_status: "pending",
    };

    const created = await admin
      .from("animals")
      .insert(insertPayload)
      .select("*")
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