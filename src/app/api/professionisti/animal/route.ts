import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import { isUuid } from "@/lib/server/validators";

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
  owner_email?: string | null;
  ownerEmail?: string | null;
  pending_owner_email?: string | null;
};

type ProfessionalProfileRow = {
  user_id: string;
  org_id: string | null;
};

type ProfessionalRow = {
  id: string;
  owner_id: string;
};

type AnimalRow = {
  id: string;
  name: string | null;
  species: string | null;
  breed: string | null;
  color: string | null;
  size: string | null;
  sex: string | null;
  sterilized: boolean | null;
  birth_date: string | null;
  chip_number: string | null;
  photo_url: string | null;
  owner_id: string | null;
  pending_owner_email: string | null;
  created_by_org_id: string | null;
  origin_org_id: string | null;
  microchip_verified: boolean | null;
  unimalia_code?: string | null;
  owner_claim_status?: "none" | "pending" | "claimed" | null;
  created_by_role?: string | null;
  updated_at?: string | null;
};

type AnimalGrantRow = {
  id: string;
  grantee_id: string;
  status: string;
  valid_from: string | null;
  valid_to: string | null;
  revoked_at: string | null;
  scope_read: boolean | null;
  scope_write: boolean | null;
};

type AnimalAuditRow = {
  id: string;
};

type ProfileRow = {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

function normalizeChip(value?: string | null) {
  const digits = String(value ?? "").replace(/\D+/g, "").trim();
  return digits.length ? digits : null;
}

function isValidChip(value: string) {
  return /^\d{15}$/.test(value);
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

function normalizeEmail(value?: string | null) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function normalizeComparableText(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

async function getProfessionalRefs(userId: string) {
  const admin = supabaseAdmin();
  const refs = new Set<string>();
  refs.add(userId);

  try {
    const organizationId = await getProfessionalOrgId();
    if (organizationId) {
      refs.add(organizationId);
    }
  } catch {
    // fallback silenzioso: proseguiamo con gli altri riferimenti disponibili
  }

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", userId)
    .maybeSingle<ProfessionalProfileRow>();

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
    .maybeSingle<ProfessionalRow>();

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
    const byId = await admin.from("animals").select("*").eq("id", ref).maybeSingle<AnimalRow>();

    if (byId.error) return byId;
    if (byId.data) return byId;
  }

  const chip = digitsOnly(ref);
  if (chip.length === 15 || chip.length === 10) {
    const byChip = await admin
      .from("animals")
      .select("*")
      .eq("chip_number", chip)
      .maybeSingle<AnimalRow>();

    if (byChip.error) return byChip;
    if (byChip.data) return byChip;
  }

  const byCode = await admin
    .from("animals")
    .select("*")
    .eq("unimalia_code", ref)
    .maybeSingle<AnimalRow>();

  return byCode;
}

async function getOwnerDetails(ownerId?: string | null) {
  if (!ownerId) {
    return {
      owner_name: null,
      owner_first_name: null,
      owner_last_name: null,
      owner_phone: null,
      owner_email: null,
    };
  }

  const admin = supabaseAdmin();

  const profileResult = await admin
    .from("profiles")
    .select("full_name, first_name, last_name, phone")
    .eq("id", ownerId)
    .maybeSingle<ProfileRow>();

  if (profileResult.error) {
    throw profileResult.error;
  }

  let ownerEmail: string | null = null;

  try {
    const authUserResult = await admin.auth.admin.getUserById(ownerId);
    ownerEmail = authUserResult?.data?.user?.email ?? null;
  } catch {
    ownerEmail = null;
  }

  const profile = profileResult.data;

  const firstName = profile?.first_name?.trim() || null;
  const lastName = profile?.last_name?.trim() || null;
  const fullName =
    profile?.full_name?.trim() ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    null;

  return {
    owner_name: fullName,
    owner_first_name: firstName,
    owner_last_name: lastName,
    owner_phone: profile?.phone?.trim() || null,
    owner_email: ownerEmail,
  };
}

async function findAnimalByChip(chipNumber: string) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("animals")
    .select("*")
    .eq("chip_number", chipNumber)
    .limit(2)
    .returns<AnimalRow[]>();

  if (result.error) {
    throw result.error;
  }

  const rows = result.data ?? [];

  if (rows.length > 1) {
    throw new Error("Conflitto dati: esistono più animali con questo microchip.");
  }

  return rows[0] ?? null;
}

async function findAnimalByPendingOwnerEmailAndCoreData(params: {
  ownerEmail: string;
  name: string;
  species: string;
}) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("animals")
    .select("*")
    .eq("pending_owner_email", params.ownerEmail)
    .limit(10)
    .returns<AnimalRow[]>();

  if (result.error) {
    throw result.error;
  }

  const rows = (result.data ?? []).filter((row) => {
    const rowName = normalizeComparableText(row?.name);
    const rowSpecies = normalizeComparableText(row?.species);

    return (
      rowName === normalizeComparableText(params.name) &&
      rowSpecies === normalizeComparableText(params.species)
    );
  });

  if (rows.length > 1) {
    throw new Error("Conflitto dati: esistono più animali compatibili con questa email owner.");
  }

  return rows[0] ?? null;
}

async function hasProfessionalAuditHistory(params: {
  animalId: string;
  userId: string;
  refs: string[];
}) {
  const admin = supabaseAdmin();

  const ownAuditResult = await admin
    .from("animal_clinic_event_audit")
    .select("id", { count: "exact", head: true })
    .eq("animal_id", params.animalId)
    .eq("actor_user_id", params.userId)
    .in("action", ["create", "update"])
    .returns<AnimalAuditRow[]>();

  if (ownAuditResult.error) {
    throw ownAuditResult.error;
  }

  const ownCount = ownAuditResult.count ?? 0;
  if (ownCount > 0) return true;

  const orgRefs = params.refs.filter(
    (ref) => typeof ref === "string" && ref.length > 0 && ref !== params.userId
  );

  if (orgRefs.length === 0) {
    return false;
  }

  const orgAuditResult = await admin
    .from("animal_clinic_event_audit")
    .select("id", { count: "exact", head: true })
    .eq("animal_id", params.animalId)
    .in("actor_org_id", orgRefs)
    .in("action", ["create", "update"])
    .returns<AnimalAuditRow[]>();

  if (orgAuditResult.error) {
    throw orgAuditResult.error;
  }

  return (orgAuditResult.count ?? 0) > 0;
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

    const animal = animalResult.data;

    const grantResult = await admin
      .from("animal_access_grants")
      .select(
        "id, grantee_id, status, valid_from, valid_to, revoked_at, scope_read, scope_write"
      )
      .eq("animal_id", animal.id)
      .eq("grantee_type", "organization")
      .in("grantee_id", refs)
      .is("revoked_at", null)
      .returns<AnimalGrantRow[]>();

    if (grantResult.error) {
      return NextResponse.json(
        { error: grantResult.error.message || "Errore verifica grant" },
        { status: 500 }
      );
    }

    const now = Date.now();

    const activeGrant =
      (grantResult.data ?? []).find((g) => {
        if (g.status !== "active") return false;
        if (!g.scope_read && !g.scope_write) return false;

        if (g.valid_from) {
          const validFromMs = new Date(g.valid_from).getTime();
          if (!Number.isNaN(validFromMs) && validFromMs > now) return false;
        }

        if (!g.valid_to) return true;

        const validToMs = new Date(g.valid_to).getTime();
        if (Number.isNaN(validToMs)) return false;

        return validToMs > now;
      }) ?? null;

    const hasGrant = Boolean(activeGrant);

    const isClinicOrigin =
      refs.includes(String(animal.created_by_org_id ?? "")) ||
      refs.includes(String(animal.origin_org_id ?? ""));

    let hasOwnHistory = false;

    try {
      hasOwnHistory = await hasProfessionalAuditHistory({
        animalId: String(animal.id),
        userId: user.id,
        refs,
      });
    } catch (historyError: unknown) {
      return NextResponse.json(
        {
          error:
            historyError instanceof Error
              ? historyError.message
              : "Errore verifica storico clinico",
        },
        { status: 500 }
      );
    }

    const canAccess = hasGrant || isClinicOrigin || hasOwnHistory;

    if (!canAccess) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    let grantStatus: "active" | "revoked_own_history" | "clinic_origin" = "clinic_origin";

    if (hasGrant) {
      grantStatus = "active";
    } else if (hasOwnHistory) {
      grantStatus = "revoked_own_history";
    }

    const ownerDetails = await getOwnerDetails(animal.owner_id ?? null);

    return NextResponse.json({
      animal: {
        ...animal,
        microchip: animal.chip_number ?? null,
        owner_name: ownerDetails.owner_name,
        owner_first_name: ownerDetails.owner_first_name,
        owner_last_name: ownerDetails.owner_last_name,
        owner_phone: ownerDetails.owner_phone,
        owner_email: ownerDetails.owner_email,
        grant_status: grantStatus,
        has_active_grant: hasGrant,
        has_own_history: hasOwnHistory,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
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

    let organizationId: string | null = null;

    try {
      organizationId = await getProfessionalOrgId();
    } catch {
      organizationId = null;
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Profilo professionista non collegato a una organizzazione." },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => null)) as AnimalPayload | null;

    if (!body) {
      return NextResponse.json({ error: "Body non valido" }, { status: 400 });
    }

    const name = body.name?.trim() ?? "";
    const species = body.species?.trim() ?? "";
    const chipNumber = normalizeChip(body.microchip ?? body.chip_number ?? null);
    const ownerEmail = normalizeEmail(
      body.owner_email ?? body.ownerEmail ?? body.pending_owner_email ?? null
    );

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

    let matchedAnimal: AnimalRow | null = null;
    let matchReason: "chip" | "owner_email" | null = null;

    if (chipNumber) {
      matchedAnimal = await findAnimalByChip(chipNumber);
      if (matchedAnimal) {
        matchReason = "chip";
      }
    }

    if (!matchedAnimal && ownerEmail) {
      matchedAnimal = await findAnimalByPendingOwnerEmailAndCoreData({
        ownerEmail,
        name,
        species,
      });

      if (matchedAnimal) {
        matchReason = "owner_email";
      }
    }

    if (matchedAnimal) {
      const patch: Partial<AnimalRow> & { updated_at: string } = {
        updated_at: new Date().toISOString(),
      };

      if (!matchedAnimal.breed && body.breed?.trim()) patch.breed = body.breed.trim();
      if (!matchedAnimal.color && body.color?.trim()) patch.color = body.color.trim();
      if (!matchedAnimal.size && body.size?.trim()) patch.size = body.size.trim();
      if (!matchedAnimal.sex && body.sex?.trim()) patch.sex = body.sex.trim();
      if (matchedAnimal.sterilized == null && typeof body.sterilized === "boolean") {
        patch.sterilized = body.sterilized;
      }
      if (!matchedAnimal.birth_date && body.birth_date) patch.birth_date = body.birth_date;
      if (!matchedAnimal.photo_url && body.photo_url) patch.photo_url = body.photo_url;
      if (!matchedAnimal.chip_number && chipNumber) patch.chip_number = chipNumber;
      if (!matchedAnimal.pending_owner_email && ownerEmail) patch.pending_owner_email = ownerEmail;
      if (!matchedAnimal.origin_org_id) patch.origin_org_id = organizationId;
      if (matchedAnimal.microchip_verified == null) patch.microchip_verified = false;

      if (Object.keys(patch).length > 1) {
        const upd = await admin
          .from("animals")
          .update(patch)
          .eq("id", matchedAnimal.id)
          .select("*")
          .single<AnimalRow>();

        if (upd.error || !upd.data) {
          return NextResponse.json(
            { error: upd.error?.message || "Errore aggiornamento animale esistente" },
            { status: 500 }
          );
        }

        matchedAnimal = upd.data;
      }

      return NextResponse.json(
        {
          ok: true,
          matched: true,
          match_reason: matchReason,
          animal: {
            ...matchedAnimal,
            microchip: matchedAnimal.chip_number ?? null,
          },
        },
        { status: 200 }
      );
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
      pending_owner_email: ownerEmail,
      created_by_role: "professional",
      created_by_org_id: organizationId,
      origin_org_id: organizationId,
      owner_claim_status: "pending",
      microchip_verified: false,
    };

    const created = await admin.from("animals").insert(insertPayload).select("*").single<AnimalRow>();

    if (created.error || !created.data) {
      return NextResponse.json(
        { error: created.error?.message || "Errore creazione animale" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        matched: false,
        animal: {
          ...created.data,
          microchip: created.data.chip_number ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    );
  }
}