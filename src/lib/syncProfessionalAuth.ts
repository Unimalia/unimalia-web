import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SyncResult =
  | {
      ok: true;
      professionalId: string;
      authUserId: string;
      organizationId: string | null;
      isProfessional: boolean;
      isVet: boolean;
      professionalType: "generic" | "veterinarian" | null;
    }
  | {
      ok: false;
      error: string;
    };

type ProfessionalRow = {
  id: string;
  owner_id: string | null;
  approved: boolean | null;
  is_vet: boolean | null;
  is_archived: boolean | null;
  is_deleted: boolean | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  province: string | null;
  address: string | null;
  vat_number: string | null;
};

type OrganizationRow = {
  id: string;
  name: string | null;
  email: string | null;
};

type ProfessionalProfileRow = {
  user_id: string;
  org_id: string | null;
  role: string | null;
  org_name: string | null;
};

function clean(value: string | null | undefined) {
  const v = String(value || "").trim();
  return v || null;
}

function buildOrganizationName(professional: ProfessionalRow) {
  return (
    clean(professional.business_name) ||
    clean(professional.legal_name) ||
    clean(professional.display_name) ||
    [clean(professional.first_name), clean(professional.last_name)].filter(Boolean).join(" ").trim() ||
    clean(professional.email) ||
    "Organizzazione professionale"
  );
}

export async function syncProfessionalAuth(professionalId: string): Promise<SyncResult> {
  const admin = supabaseAdmin();

  const { data: professional, error: professionalError } = await admin
    .from("professionals")
    .select(
      [
        "id",
        "owner_id",
        "approved",
        "is_vet",
        "is_archived",
        "is_deleted",
        "display_name",
        "first_name",
        "last_name",
        "business_name",
        "legal_name",
        "email",
        "phone",
        "website",
        "city",
        "province",
        "address",
        "vat_number",
      ].join(",")
    )
    .eq("id", professionalId)
    .single<ProfessionalRow>();

  if (professionalError || !professional) {
    return {
      ok: false,
      error: professionalError?.message || "Professionista non trovato",
    };
  }

  const authUserId = clean(professional.owner_id);

  if (!authUserId) {
    return {
      ok: false,
      error: "owner_id mancante sul professionista: impossibile sincronizzare Auth",
    };
  }

  const { data: authData, error: authReadError } = await admin.auth.admin.getUserById(authUserId);

  if (authReadError || !authData?.user) {
    return {
      ok: false,
      error: authReadError?.message || "Utente Auth non trovato",
    };
  }

  const lifecycleBlocked = professional.is_archived === true || professional.is_deleted === true;
  const isProfessional = !lifecycleBlocked && professional.approved === true;
  const isVet = !lifecycleBlocked && professional.approved === true && professional.is_vet === true;
  const professionalType: "generic" | "veterinarian" | null = !isProfessional
    ? null
    : isVet
      ? "veterinarian"
      : "generic";

  let organizationId: string | null = null;

  const existingProfileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id, role, org_name")
    .eq("user_id", authUserId)
    .maybeSingle<ProfessionalProfileRow>();

  if (existingProfileResult.error) {
    return {
      ok: false,
      error: existingProfileResult.error.message,
    };
  }

  if (existingProfileResult.data?.org_id) {
    const orgCheck = await admin
      .from("organizations")
      .select("id, name, email")
      .eq("id", existingProfileResult.data.org_id)
      .maybeSingle<OrganizationRow>();

    if (orgCheck.error) {
      return {
        ok: false,
        error: orgCheck.error.message,
      };
    }

    if (orgCheck.data?.id) {
      organizationId = orgCheck.data.id;
    }
  }

  // ❌ RIMOSSO lookup via email → niente fallback sporco

  if (!organizationId) {
    const organizationName = buildOrganizationName(professional);

    const { data: createdOrganization, error: createOrganizationError } = await admin
      .from("organizations")
      .insert({
        type: isVet ? "clinic" : "professional",
        name: organizationName,
        legal_name: clean(professional.legal_name),
        email: clean(authData.user.email) || clean(professional.email),
        phone: clean(professional.phone),
        website: clean(professional.website),
        address: clean(professional.address),
        city: clean(professional.city),
        province: clean(professional.province),
        vat_number: clean(professional.vat_number),
        verification_status: professional.approved === true ? "verified" : "pending",
        submitted_at: new Date().toISOString(),
        verified_at: professional.approved === true ? new Date().toISOString() : null,
        verified_by_user_id: null,
      })
      .select("id, name, email")
      .single<OrganizationRow>();

    if (createOrganizationError || !createdOrganization?.id) {
      return {
        ok: false,
        error: createOrganizationError?.message || "Impossibile creare organization",
      };
    }

    organizationId = createdOrganization.id;
  }

  const profilePayload = {
    user_id: authUserId,
    role: isVet ? "veterinarian" : "professional",
    org_id: organizationId,
    org_name: buildOrganizationName(professional),
  };

  if (existingProfileResult.data) {
    const { error: updateProfileError } = await admin
      .from("professional_profiles")
      .update(profilePayload)
      .eq("user_id", authUserId);

    if (updateProfileError) {
      return {
        ok: false,
        error: updateProfileError.message,
      };
    }
  } else {
    const { error: insertProfileError } = await admin.from("professional_profiles").insert(profilePayload);

    if (insertProfileError) {
      return {
        ok: false,
        error: insertProfileError.message,
      };
    }
  }

  const currentAppMetadata =
    authData.user.app_metadata && typeof authData.user.app_metadata === "object"
      ? authData.user.app_metadata
      : {};

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(authUserId, {
    app_metadata: {
      ...currentAppMetadata,
      is_professional: isProfessional,
      is_vet: isVet,
      professional_type: professionalType,
      organization_id: organizationId,
    },
  });

  if (authUpdateError) {
    return {
      ok: false,
      error: authUpdateError.message,
    };
  }

  return {
    ok: true,
    professionalId,
    authUserId,
    organizationId,
    isProfessional,
    isVet,
    professionalType,
  };
}