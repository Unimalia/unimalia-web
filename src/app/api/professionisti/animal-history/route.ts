import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import {
  parseProfessionalHistoryCreateInput,
  type AnimalHistoryEventRow,
} from "@/lib/professionisti/history";

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

async function getProfessionalSnapshot(userId: string) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("professionals")
    .select("id, owner_id, display_name, category")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return {
    professionalId: result.data?.id ?? null,
    displayName: result.data?.display_name ?? null,
    category: result.data?.category ?? null,
  };
}

async function ensureProfessionalAnimalAccess(userId: string, animalId: string) {
  const admin = supabaseAdmin();
  const refs = await getProfessionalRefs(userId);

  if (refs.length === 0) {
    throw new Error("Profilo professionista non valido o organizzazione non trovata");
  }

  const animalResult = await admin
    .from("animals")
    .select("id, created_by_org_id, origin_org_id")
    .eq("id", animalId)
    .maybeSingle();

  if (animalResult.error) {
    throw animalResult.error;
  }

  if (!animalResult.data) {
    return {
      canAccess: false,
      animal: null,
      refs,
    };
  }

  const animal = animalResult.data;
  const now = Date.now();

  const grantResult = await admin
    .from("animal_access_grants")
    .select("id, grantee_id, status, valid_to, revoked_at, scope_read, scope_write")
    .eq("animal_id", animalId)
    .eq("grantee_type", "org")
    .in("grantee_id", refs)
    .is("revoked_at", null);

  if (grantResult.error) {
    throw grantResult.error;
  }

  const activeGrant =
    (grantResult.data ?? []).find((g: any) => {
      if (g.status !== "active" && g.status !== "approved") return false;
      if (!g.scope_read && !g.scope_write) return false;
      if (!g.valid_to) return true;

      const validToMs = new Date(g.valid_to).getTime();
      if (Number.isNaN(validToMs)) return true;

      return validToMs > now;
    }) ?? null;

  const canAccess =
    Boolean(activeGrant) ||
    refs.includes(String(animal.created_by_org_id ?? "")) ||
    refs.includes(String(animal.origin_org_id ?? ""));

  return {
    canAccess,
    animal,
    refs,
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

    const animalId = (req.nextUrl.searchParams.get("animalId") || "").trim();

    if (!animalId) {
      return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
    }

    if (!isUuid(animalId)) {
      return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
    }

    const access = await ensureProfessionalAnimalAccess(user.id, animalId);

    if (!access.animal) {
      return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
    }

    if (!access.canAccess) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    const result = await admin
      .from("animal_history_events")
      .select(
        "id, animal_id, author_type, author_user_id, author_name_snapshot, professional_org_id, professional_category, source_scope, category, event_type, title, description, event_date, next_action_date, status, visibility, meta, created_at, updated_at"
      )
      .eq("animal_id", animalId)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Errore caricamento storia animale" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      events: (result.data ?? []) as AnimalHistoryEventRow[],
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

    const body = await req.json();
    const input = parseProfessionalHistoryCreateInput(body);

    if (!isUuid(input.animalId)) {
      return NextResponse.json({ error: "animalId non valido" }, { status: 400 });
    }

    const access = await ensureProfessionalAnimalAccess(user.id, input.animalId);

    if (!access.animal) {
      return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
    }

    if (!access.canAccess) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    let professionalOrgId: string | null = null;
    try {
      professionalOrgId = await getProfessionalOrgId();
    } catch {
      professionalOrgId = null;
    }

    const professionalSnapshot = await getProfessionalSnapshot(user.id);

    const insertPayload = {
      animal_id: input.animalId,
      author_type: "professional",
      author_user_id: user.id,
      author_name_snapshot: professionalSnapshot.displayName,
      professional_org_id: professionalOrgId,
      professional_category: professionalSnapshot.category,
      source_scope: input.sourceScope,
      category: input.category,
      event_type: input.eventType,
      title: input.title,
      description: input.description,
      event_date: input.eventDate,
      next_action_date: input.nextActionDate,
      status: input.status,
      visibility: input.visibility,
      meta: input.meta,
    };

    const created = await admin
      .from("animal_history_events")
      .insert(insertPayload)
      .select(
        "id, animal_id, author_type, author_user_id, author_name_snapshot, professional_org_id, professional_category, source_scope, category, event_type, title, description, event_date, next_action_date, status, visibility, meta, created_at, updated_at"
      )
      .single();

    if (created.error || !created.data) {
      return NextResponse.json(
        { error: created.error?.message || "Errore creazione evento storia animale" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        event: created.data as AnimalHistoryEventRow,
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