import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import { isUuid } from "@/lib/server/validators";

const resend = new Resend(process.env.RESEND_API_KEY);

type AnimalPayload = {
  name?: string;
  species?: string;
  breed?: string | null;
  color?: string | null;
  size?: string | null;
  sex?: string | null;
  sterilized?: boolean | null;
  birth_date?: string | null;
  chip_number?: string | null;
  photo_url?: string | null;
  pending_owner_email?: string | null;
  pending_owner_phone?: string | null;
};

type ProfessionalProfileRow = {
  user_id: string;
  organization_id: string | null;
};

type ProfessionalRow = {
  id: string;
  owner_id: string;
  business_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type OrganizationRow = {
  id: string;
  name: string | null;
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
  pending_owner_phone?: string | null;
  pending_owner_invited_at?: string | null;
  invite_email_count?: number | null;
  created_by_organization_id: string | null;
  origin_organization_id: string | null;
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

type ClaimRow = {
  id: string;
  claim_token: string | null;
  used_at: string | null;
  created_at: string;
};

type ResendEmailResult = {
  data?: { id?: string } | null;
  error?: { message?: string } | null;
};

type AuthUserLookupResult = {
  id: string;
  email: string | null;
} | null;

type InviteResult =
  | {
      sent: true;
      mode: "claim";
      claimLink: string;
      resendId: string | null;
    }
  | {
      sent: true;
      mode: "notice";
      animalLink: string;
      resendId: string | null;
    }
  | {
      sent: false;
      error?: string;
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

function normalizePhone(value?: string | null) {
  let digits = String(value ?? "").replace(/\D+/g, "").trim();
  if (!digits) return null;

  if (digits.startsWith("39") && digits.length > 10) {
    digits = digits.slice(2);
  }

  return digits || null;
}

function normalizeComparableText(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

async function ensureProfileRow(userId: string) {
  const admin = supabaseAdmin();

  const existing = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data?.id) {
    return;
  }

  const upsertResult = await admin
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id" });

  if (upsertResult.error) {
    throw upsertResult.error;
  }
}

async function ensureOrganizationGrant(params: {
  animalId: string;
  organizationId: string;
  grantedByUserId: string;
}) {
  const admin = supabaseAdmin();

  await ensureProfileRow(params.grantedByUserId);

  const existingGrant = await admin
    .from("animal_access_grants")
    .select("id, status, revoked_at")
    .eq("animal_id", params.animalId)
    .eq("grantee_type", "organization")
    .eq("grantee_id", params.organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingGrant.error) {
    throw existingGrant.error;
  }

  if (existingGrant.data?.id) {
    const needsReactivate =
      existingGrant.data.status !== "active" || !!existingGrant.data.revoked_at;

    if (!needsReactivate) {
      return;
    }

    const reactivateResult = await admin
      .from("animal_access_grants")
      .update({
        granted_by_user_id: params.grantedByUserId,
        status: "active",
        revoked_at: null,
        valid_to: null,
        scope_read: true,
        scope_write: true,
        scope_upload: true,
      })
      .eq("id", existingGrant.data.id);

    if (reactivateResult.error) {
      throw reactivateResult.error;
    }

    return;
  }

  const insertResult = await admin
    .from("animal_access_grants")
    .insert({
      animal_id: params.animalId,
      granted_by_user_id: params.grantedByUserId,
      grantee_type: "organization",
      grantee_id: params.organizationId,
      status: "active",
      valid_to: null,
      revoked_at: null,
      scope_read: true,
      scope_write: true,
      scope_upload: true,
    });

  if (insertResult.error) {
    throw insertResult.error;
  }
}

async function getProfessionalRefs(userId: string) {
  const admin = supabaseAdmin();
  const refs = new Set<string>();
  refs.add(userId);

  try {
    const organizationId = await getProfessionalOrgId(userId);
    if (organizationId) {
      refs.add(organizationId);
    }
  } catch {
    // fallback silenzioso
  }

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, organization_id")
    .eq("user_id", userId)
    .maybeSingle<ProfessionalProfileRow>();

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (profileResult.data?.organization_id) {
    refs.add(profileResult.data.organization_id);
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

async function getClinicName(userId: string, organizationId: string | null) {
  const admin = supabaseAdmin();

  if (organizationId) {
    const { data: organizationRow } = await admin
      .from("organizations")
      .select("id,name")
      .eq("id", organizationId)
      .maybeSingle<OrganizationRow>();

    if (organizationRow?.name?.trim()) {
      return organizationRow.name.trim();
    }
  }

  const { data: professionalRow } = await admin
    .from("professionals")
    .select("business_name,display_name,first_name,last_name")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ProfessionalRow>();

  return (
    professionalRow?.business_name?.trim() ||
    professionalRow?.display_name?.trim() ||
    [professionalRow?.first_name, professionalRow?.last_name].filter(Boolean).join(" ").trim() ||
    null
  );
}

async function findExistingAuthUserByEmail(email: string): Promise<AuthUserLookupResult> {
  const admin = supabaseAdmin();
  const pageSize = 200;
  let page = 1;

  while (page <= 20) {
    const result = await admin.auth.admin.listUsers({
      page,
      perPage: pageSize,
    });

    if (result.error) {
      throw new Error(result.error.message || "Errore ricerca utente auth");
    }

    const users = result.data?.users ?? [];
    if (users.length === 0) {
      return null;
    }

    const match = users.find((u) => (u.email ?? "").trim().toLowerCase() === email);
    if (match) {
      return {
        id: match.id,
        email: match.email ?? null,
      };
    }

    if (users.length < pageSize) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function sendOwnerClaimEmail(params: {
  animalId: string;
  animalName: string | null;
  email: string;
  actorUserId: string;
  organizationId: string | null;
  reqOrigin: string;
}): Promise<InviteResult> {
  const admin = supabaseAdmin();
  const nowIso = new Date().toISOString();

  const existingClaimResult = await admin
    .from("animal_owner_claims")
    .select("id, claim_token, used_at, created_at")
    .eq("animal_id", params.animalId)
    .eq("email", params.email)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ClaimRow>();

  if (existingClaimResult.error) {
    throw new Error(existingClaimResult.error.message || "Errore lettura claim");
  }

  let token = existingClaimResult.data?.claim_token ?? null;

  if (!token) {
    token = crypto.randomUUID();

    const claimInsertResult = await admin
      .from("animal_owner_claims")
      .insert({
        animal_id: params.animalId,
        email: params.email,
        claim_token: token,
        created_by_user_id: params.actorUserId,
      })
      .select("id")
      .single();

    if (claimInsertResult.error) {
      throw new Error(claimInsertResult.error.message || "Errore creazione claim");
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || params.reqOrigin;
  const claimLink = `${baseUrl}/claim/${token}?email=${encodeURIComponent(params.email)}`;

  const clinicName = await getClinicName(params.actorUserId, params.organizationId);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "UNIMALIA <no-reply@unimalia.it>";

  const emailResult = (await resend.emails.send({
    from: fromEmail,
    to: params.email,
    subject: "Collega il tuo animale su UNIMALIA",
    html: `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5; max-width: 640px; margin: 0 auto;">
        <p>
          ${clinicName ? `La clinica veterinaria <strong>${clinicName}</strong>` : "Una clinica veterinaria"}
          ti ha invitato a collegare il tuo animale su UNIMALIA.
        </p>
        <p><strong>${params.animalName ?? "Il tuo animale"}</strong></p>
        <p>Per collegarlo al tuo account, apri questo link:</p>
        <p><a href="${claimLink}">${claimLink}</a></p>
        <hr style="margin: 24px 0; border: 0; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #666;">
          Se hai ricevuto questa email per errore, puoi ignorarla.
        </p>
      </div>
    `,
  })) as ResendEmailResult;

  if (emailResult?.error) {
    throw new Error(emailResult.error?.message || "Errore invio email");
  }

  const animalUpdate = await admin
    .from("animals")
    .update({
      pending_owner_email: params.email,
      pending_owner_invited_at: nowIso,
      owner_claim_status: "pending",
      invite_email_count: 1,
    })
    .eq("id", params.animalId);

  if (animalUpdate.error) {
    throw new Error(animalUpdate.error.message || "Errore aggiornamento stato invito");
  }

  return {
    sent: true,
    mode: "claim",
    claimLink,
    resendId: emailResult?.data?.id ?? null,
  };
}

async function sendOwnerNoticeEmail(params: {
  animalId: string;
  animalName: string | null;
  email: string;
  actorUserId: string;
  organizationId: string | null;
  reqOrigin: string;
}): Promise<InviteResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || params.reqOrigin;
  const animalLink = `${baseUrl}/animali/${params.animalId}`;

  const clinicName = await getClinicName(params.actorUserId, params.organizationId);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "UNIMALIA <no-reply@unimalia.it>";

  const emailResult = (await resend.emails.send({
    from: fromEmail,
    to: params.email,
    subject: "Nuovo animale collegato al tuo profilo UNIMALIA",
    html: `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5; max-width: 640px; margin: 0 auto;">
        <p>
          ${clinicName ? `La clinica veterinaria <strong>${clinicName}</strong>` : "Una clinica veterinaria"}
          ha collegato un animale al tuo profilo UNIMALIA.
        </p>
        <p><strong>${params.animalName ?? "Il tuo animale"}</strong></p>
        <p>Puoi aprire direttamente la scheda da qui:</p>
        <p><a href="${animalLink}">${animalLink}</a></p>
        <hr style="margin: 24px 0; border: 0; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #666;">
          Se ritieni che questo collegamento non sia corretto, contatta l’assistenza o la struttura che ha effettuato l’inserimento.
        </p>
      </div>
    `,
  })) as ResendEmailResult;

  if (emailResult?.error) {
    throw new Error(emailResult.error?.message || "Errore invio email avviso");
  }

  return {
    sent: true,
    mode: "notice",
    animalLink,
    resendId: emailResult?.data?.id ?? null,
  };
}

async function autoLinkOwnerIfRegistered(params: {
  animalId: string;
  pendingOwnerEmail: string | null;
  reqOrigin: string;
  actorUserId: string;
  organizationId: string | null;
  animalName: string | null;
}) {
  if (!params.pendingOwnerEmail) {
    return { linked: false as const };
  }

  const admin = supabaseAdmin();
  const existingOwner = await findExistingAuthUserByEmail(params.pendingOwnerEmail);

  if (!existingOwner?.id) {
    return { linked: false as const };
  }

  await ensureProfileRow(existingOwner.id);

  const updateResult = await admin
    .from("animals")
    .update({
      owner_id: existingOwner.id,
      owner_claim_status: "claimed",
      owner_claimed_at: new Date().toISOString(),
      pending_owner_email: null,
      pending_owner_phone: null,
      pending_owner_invited_at: null,
    })
    .eq("id", params.animalId)
    .select("*")
    .single<AnimalRow>();

  if (updateResult.error || !updateResult.data) {
    throw new Error(updateResult.error?.message || "Errore collegamento automatico owner");
  }

  const notice = await sendOwnerNoticeEmail({
    animalId: params.animalId,
    animalName: params.animalName,
    email: params.pendingOwnerEmail,
    actorUserId: params.actorUserId,
    organizationId: params.organizationId,
    reqOrigin: params.reqOrigin,
  });

  return {
    linked: true as const,
    animal: updateResult.data,
    notice,
    ownerUserId: existingOwner.id,
  };
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

  const chipNumber = digitsOnly(ref);
  if (chipNumber.length === 15 || chipNumber.length === 10) {
    const byChip = await admin
      .from("animals")
      .select("*")
      .eq("chip_number", chipNumber)
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

  let ownerEmailAddress: string | null = null;

  try {
    const authUserResult = await admin.auth.admin.getUserById(ownerId);
    ownerEmailAddress = authUserResult?.data?.user?.email ?? null;
  } catch {
    ownerEmailAddress = null;
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
    owner_email: ownerEmailAddress,
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
  pendingOwnerEmail: string;
  name: string;
  species: string;
}) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("animals")
    .select("*")
    .eq("pending_owner_email", params.pendingOwnerEmail)
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

  const organizationRefs = params.refs.filter(
    (ref) => typeof ref === "string" && ref.length > 0 && ref !== params.userId
  );

  if (organizationRefs.length === 0) {
    return false;
  }

  const organizationAuditResult = await admin
    .from("animal_clinic_event_audit")
    .select("id", { count: "exact", head: true })
    .eq("animal_id", params.animalId)
    .in("actor_organization_id", organizationRefs)
    .in("action", ["create", "update"])
    .returns<AnimalAuditRow[]>();

  if (organizationAuditResult.error) {
    throw ownAuditResult.error;
  }

  return (organizationAuditResult.count ?? 0) > 0;
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
      refs.includes(String(animal.created_by_organization_id ?? "")) ||
      refs.includes(String(animal.origin_organization_id ?? ""));

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
      organizationId = await getProfessionalOrgId(user.id);
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
    const normalizedChipNumber = normalizeChip(body.chip_number ?? null);
    const normalizedPendingOwnerEmail = normalizeEmail(body.pending_owner_email ?? null);
    const normalizedPendingOwnerPhone = normalizePhone(body.pending_owner_phone ?? null);

    if (!name) {
      return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
    }

    if (!species) {
      return NextResponse.json({ error: "Specie obbligatoria" }, { status: 400 });
    }

    if (normalizedChipNumber && !isValidChip(normalizedChipNumber)) {
      return NextResponse.json(
        { error: "Microchip non valido: servono 15 cifre" },
        { status: 400 }
      );
    }

    let matchedAnimal: AnimalRow | null = null;
    let matchReason: "chip" | "pending_owner_email" | null = null;

    if (normalizedChipNumber) {
      matchedAnimal = await findAnimalByChip(normalizedChipNumber);
      if (matchedAnimal) {
        matchReason = "chip";
      }
    }

    if (!matchedAnimal && normalizedPendingOwnerEmail) {
      matchedAnimal = await findAnimalByPendingOwnerEmailAndCoreData({
        pendingOwnerEmail: normalizedPendingOwnerEmail,
        name,
        species,
      });

      if (matchedAnimal) {
        matchReason = "pending_owner_email";
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
      if (!matchedAnimal.chip_number && normalizedChipNumber) {
        patch.chip_number = normalizedChipNumber;
      }
      if (!matchedAnimal.pending_owner_email && normalizedPendingOwnerEmail) {
        patch.pending_owner_email = normalizedPendingOwnerEmail;
      }
      if (!matchedAnimal.pending_owner_phone && normalizedPendingOwnerPhone) {
        patch.pending_owner_phone = normalizedPendingOwnerPhone;
      }
      if (!matchedAnimal.origin_organization_id) {
        patch.origin_organization_id = organizationId;
      }
      if (matchedAnimal.microchip_verified == null) patch.microchip_verified = false;
      if (!matchedAnimal.owner_claim_status && (normalizedPendingOwnerEmail || normalizedPendingOwnerPhone)) {
        patch.owner_claim_status = "pending";
      }

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

      try {
        await ensureOrganizationGrant({
          animalId: matchedAnimal.id,
          organizationId,
          grantedByUserId: user.id,
        });
      } catch (grantError: unknown) {
        return NextResponse.json(
          {
            error:
              grantError instanceof Error
                ? `Animale trovato ma errore grant automatico: ${grantError.message}`
                : "Animale trovato ma errore grant automatico",
          },
          { status: 500 }
        );
      }

      let invite: InviteResult = { sent: false };

      if (!matchedAnimal.owner_id && normalizedPendingOwnerEmail) {
        try {
          const linked = await autoLinkOwnerIfRegistered({
            animalId: matchedAnimal.id,
            pendingOwnerEmail: normalizedPendingOwnerEmail,
            reqOrigin: req.nextUrl.origin,
            actorUserId: user.id,
            organizationId,
            animalName: matchedAnimal.name ?? null,
          });

          if (linked.linked) {
            matchedAnimal = linked.animal;
            invite = linked.notice;
          } else {
            invite = await sendOwnerClaimEmail({
              animalId: matchedAnimal.id,
              animalName: matchedAnimal.name ?? null,
              email: normalizedPendingOwnerEmail,
              actorUserId: user.id,
              organizationId,
              reqOrigin: req.nextUrl.origin,
            });
          }
        } catch (inviteError: unknown) {
          invite = {
            sent: false,
            error: inviteError instanceof Error ? inviteError.message : "Errore invio owner",
          };
        }
      }

      return NextResponse.json(
        {
          ok: true,
          matched: true,
          match_reason: matchReason,
          invite,
          animal: {
            ...matchedAnimal,
            has_active_grant: true,
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
      chip_number: normalizedChipNumber,
      photo_url: body.photo_url || null,
      owner_id: null,
      pending_owner_email: normalizedPendingOwnerEmail,
      pending_owner_phone: normalizedPendingOwnerPhone,
      created_by_role: "professional",
      created_by_organization_id: organizationId,
      origin_organization_id: organizationId,
      owner_claim_status:
        normalizedPendingOwnerEmail || normalizedPendingOwnerPhone ? "pending" : "none",
      microchip_verified: false,
    };

    const created = await admin
      .from("animals")
      .insert(insertPayload)
      .select("*")
      .single<AnimalRow>();

    if (created.error || !created.data) {
      return NextResponse.json(
        { error: created.error?.message || "Errore creazione animale" },
        { status: 500 }
      );
    }

    try {
      await ensureOrganizationGrant({
        animalId: created.data.id,
        organizationId,
        grantedByUserId: user.id,
      });
    } catch (grantError: unknown) {
      return NextResponse.json(
        {
          error:
            grantError instanceof Error
              ? `Animale creato ma errore grant automatico: ${grantError.message}`
              : "Animale creato ma errore grant automatico",
        },
        { status: 500 }
      );
    }

    let finalAnimal = created.data;

    let invite: InviteResult = { sent: false };

    if (normalizedPendingOwnerEmail) {
      try {
        const linked = await autoLinkOwnerIfRegistered({
          animalId: created.data.id,
          pendingOwnerEmail: normalizedPendingOwnerEmail,
          reqOrigin: req.nextUrl.origin,
          actorUserId: user.id,
          organizationId,
          animalName: created.data.name ?? null,
        });

        if (linked.linked) {
          finalAnimal = linked.animal;
          invite = linked.notice;
        } else {
          invite = await sendOwnerClaimEmail({
            animalId: created.data.id,
            animalName: created.data.name ?? null,
            email: normalizedPendingOwnerEmail,
            actorUserId: user.id,
            organizationId,
            reqOrigin: req.nextUrl.origin,
          });
        }
      } catch (inviteError: unknown) {
        invite = {
          sent: false,
          error: inviteError instanceof Error ? inviteError.message : "Errore invio owner",
        };
      }
    }

    return NextResponse.json(
      {
        ok: true,
        matched: false,
        invite,
        animal: {
          ...finalAnimal,
          has_active_grant: true,
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