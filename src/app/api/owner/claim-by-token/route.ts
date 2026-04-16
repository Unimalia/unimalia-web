import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

type ClaimByTokenBody = {
  token?: string;
};

type ClaimRow = {
  id: string;
  animal_id: string | null;
  used_at: string | null;
  expires_at: string | null;
};

type AnimalClaimRow = {
  id: string;
  owner_id: string | null;
  created_by_organization_id: string | null;
  origin_organization_id: string | null;
  chip_number: string | null;
  microchip_verified: boolean | null;
  pending_owner_email: string | null;
  pending_owner_phone?: string | null;
};

type ExistingGrantRow = {
  id: string;
  status: string | null;
  revoked_at: string | null;
};

type AuthUserMetadata = {
  full_name?: unknown;
  city?: unknown;
  fiscal_code?: unknown;
  phone?: unknown;
};

type ProfileRow = {
  phone: string | null;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function normalizeFiscalCode(value: unknown) {
  const raw = typeof value === "string" ? value.replace(/\s+/g, "").trim().toUpperCase() : "";
  return raw || null;
}

function normalizePhone(value: unknown) {
  const raw = typeof value === "string" ? value.replace(/\s+/g, "").trim() : "";
  return raw || null;
}

async function ensureProfileRow(userId: string) {
  const admin = supabaseAdmin();

  const authUserResult = await admin.auth.admin.getUserById(userId);
  const authUser = authUserResult.data.user;

  if (!authUser) {
    throw new Error("Utente auth non trovato");
  }

  const metadata = (authUser.user_metadata ?? {}) as AuthUserMetadata;

  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: normalizeString(metadata.full_name),
      city: normalizeString(metadata.city),
      fiscal_code: normalizeFiscalCode(metadata.fiscal_code),
      phone: normalizePhone(metadata.phone),
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message || "Errore creazione profilo");
  }
}

async function hydrateOwnerPhoneFromAnimal(userId: string, pendingOwnerPhone?: string | null) {
  const phone = normalizePhone(pendingOwnerPhone);
  if (!phone) return;

  const admin = supabaseAdmin();

  const profileResult = await admin
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (profileResult.error) {
    throw new Error(profileResult.error.message || "Errore lettura profilo");
  }

  const currentPhone = normalizePhone(profileResult.data?.phone);

  if (currentPhone) {
    return;
  }

  const updateResult = await admin
    .from("profiles")
    .update({ phone })
    .eq("id", userId);

  if (updateResult.error) {
    throw new Error(updateResult.error.message || "Errore aggiornamento telefono profilo");
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

    const body = (await req.json().catch(() => null)) as ClaimByTokenBody | null;
    const token = String(body?.token ?? "").trim();

    if (!token) {
      return NextResponse.json({ error: "Token mancante" }, { status: 400 });
    }

    const claimResult = await admin
      .from("animal_owner_claims")
      .select("id, animal_id, used_at, expires_at")
      .eq("claim_token", token)
      .single<ClaimRow>();

    if (claimResult.error || !claimResult.data) {
      return NextResponse.json({ error: "Invito non valido" }, { status: 404 });
    }

    const claim = claimResult.data;

    if (!claim.animal_id) {
      return NextResponse.json({ error: "animal_id mancante nel claim" }, { status: 500 });
    }

    const animalResult = await admin
      .from("animals")
      .select(
        "id, owner_id, created_by_organization_id, origin_organization_id, chip_number, microchip_verified, pending_owner_email, pending_owner_phone"
      )
      .eq("id", claim.animal_id)
      .single<AnimalClaimRow>();

    if (animalResult.error || !animalResult.data) {
      return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
    }

    const animal = animalResult.data;

    if (claim.used_at) {
      if (animal.id && animal.owner_id === user.id) {
        return NextResponse.json({
          ok: true,
          animalId: animal.id,
        });
      }

      return NextResponse.json({ error: "Invito giÃ  utilizzato" }, { status: 409 });
    }

    if (claim.expires_at && new Date(claim.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Invito scaduto" }, { status: 410 });
    }

    if (animal.owner_id && animal.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Animale giÃ  collegato a un altro proprietario" },
        { status: 409 }
      );
    }

    let userEmail: string | null = null;

    try {
      const authUser = await admin.auth.admin.getUserById(user.id);
      userEmail = authUser.data.user?.email?.trim().toLowerCase() ?? null;
    } catch {
      userEmail = null;
    }

    const pendingOwnerEmail = String(animal.pending_owner_email ?? "")
      .trim()
      .toLowerCase();

    if (pendingOwnerEmail && userEmail && pendingOwnerEmail !== userEmail) {
      return NextResponse.json(
        { error: "Questo invito non corrisponde all'email del proprietario." },
        { status: 403 }
      );
    }

    await ensureProfileRow(user.id);
    await hydrateOwnerPhoneFromAnimal(user.id, animal.pending_owner_phone ?? null);

    const nowIso = new Date().toISOString();

    const animalUpdate = await admin
      .from("animals")
      .update({
        owner_id: user.id,
        owner_claim_status: "claimed",
        owner_claimed_at: nowIso,
        pending_owner_email: null,
        pending_owner_phone: null,
        pending_owner_invited_at: null,
      })
      .eq("id", claim.animal_id)
      .select("id, created_by_organization_id, origin_organization_id")
      .single<{ id: string; created_by_organization_id: string | null; origin_organization_id: string | null }>();

    if (animalUpdate.error || !animalUpdate.data) {
      return NextResponse.json(
        { error: animalUpdate.error?.message || "Errore collegamento animale" },
        { status: 500 }
      );
    }

    const claimUpdate = await admin
      .from("animal_owner_claims")
      .update({
        used_by: user.id,
        used_at: nowIso,
      })
      .eq("id", claim.id)
      .is("used_at", null);

    if (claimUpdate.error) {
      return NextResponse.json(
        { error: claimUpdate.error.message || "Errore aggiornamento invito" },
        { status: 500 }
      );
    }

    const originOrganizationId =
      animalUpdate.data.created_by_organization_id || animalUpdate.data.origin_organization_id || null;

    if (originOrganizationId) {
      const existingGrantResult = await admin
        .from("animal_access_grants")
        .select("id, status, revoked_at")
        .eq("animal_id", claim.animal_id)
        .eq("grantee_type", "organization")
        .eq("grantee_id", originOrganizationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<ExistingGrantRow>();

      if (existingGrantResult.error) {
        return NextResponse.json(
          { error: existingGrantResult.error.message || "Errore verifica grant clinica" },
          { status: 500 }
        );
      }

      if (existingGrantResult.data?.id) {
        const shouldReactivate =
          existingGrantResult.data.status !== "active" || !!existingGrantResult.data.revoked_at;

        if (shouldReactivate) {
          const reactivateGrant = await admin
            .from("animal_access_grants")
            .update({
              granted_by_user_id: user.id,
              status: "active",
              revoked_at: null,
              valid_to: null,
              scope_read: true,
              scope_write: true,
              scope_upload: true,
            })
            .eq("id", existingGrantResult.data.id);

          if (reactivateGrant.error) {
            return NextResponse.json(
              { error: reactivateGrant.error.message || "Errore riattivazione grant clinica" },
              { status: 500 }
            );
          }
        }
      } else {
        const insertGrant = await admin.from("animal_access_grants").insert({
          animal_id: claim.animal_id,
          grantee_type: "organization",
          grantee_id: originOrganizationId,
          granted_by_user_id: user.id,
          status: "active",
          valid_to: null,
          revoked_at: null,
          scope_read: true,
          scope_write: true,
          scope_upload: true,
        });

        if (insertGrant.error) {
          return NextResponse.json(
            { error: insertGrant.error.message || "Errore creazione grant clinica" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      ok: true,
      animalId: animalUpdate.data.id,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    );
  }
}
