import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type ProfessionalProfileRow = {
  user_id: string;
  org_id: string | null;
};

type OrganizationRow = {
  id: string;
  name: string | null;
};

type ProfessionalRow = {
  business_name: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type AnimalRow = {
  id: string;
  name: string | null;
  created_by_org_id: string | null;
  origin_org_id: string | null;
  owner_id: string | null;
  pending_owner_email: string | null;
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

async function getProfessionalOrgId(userId: string) {
  const admin = supabaseAdmin();

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", userId)
    .maybeSingle<ProfessionalProfileRow>();

  if (profileResult.data?.org_id) {
    return {
      orgId: profileResult.data.org_id as string,
      profile: profileResult.data,
    };
  }

  return {
    orgId: null,
    profile: null,
  };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

    const body = await req.json().catch(() => null);
    const animalId = String((body as { animalId?: string } | null)?.animalId ?? "").trim();
    const email = String((body as { email?: string } | null)?.email ?? "").trim().toLowerCase();

    if (!animalId || !email) {
      return NextResponse.json({ error: "animalId o email mancanti" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email non valida" }, { status: 400 });
    }

    const orgLookup = await getProfessionalOrgId(user.id);

    let clinicName: string | null = null;

    if (orgLookup.orgId) {
      const { data: orgRow } = await admin
        .from("organizations")
        .select("id,name")
        .eq("id", orgLookup.orgId)
        .maybeSingle<OrganizationRow>();

      clinicName = orgRow?.name?.trim() || null;
    }

    if (!clinicName) {
      const { data: professionalRow } = await admin
        .from("professionals")
        .select("business_name,display_name,first_name,last_name")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<ProfessionalRow>();

      clinicName =
        professionalRow?.business_name?.trim() ||
        professionalRow?.display_name?.trim() ||
        [professionalRow?.first_name, professionalRow?.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        null;
    }

    if (!orgLookup.orgId) {
      return NextResponse.json({ error: "Profilo professionista non valido" }, { status: 403 });
    }

    const animalResult = await admin
      .from("animals")
      .select("id, name, created_by_org_id, origin_org_id, owner_id, pending_owner_email")
      .eq("id", animalId)
      .single<AnimalRow>();

    if (animalResult.error || !animalResult.data) {
      return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
    }

    const animal = animalResult.data;

    const canAccess =
      animal.created_by_org_id === orgLookup.orgId || animal.origin_org_id === orgLookup.orgId;

    if (!canAccess) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    if (animal.owner_id) {
      return NextResponse.json(
        { error: "Questo animale ha già un proprietario collegato" },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();

    const { error: animalUpdateError } = await admin
      .from("animals")
      .update({
        pending_owner_email: email,
        pending_owner_invited_at: nowIso,
        owner_claim_status: "pending",
      })
      .eq("id", animalId);

    if (animalUpdateError) {
      return NextResponse.json(
        { error: animalUpdateError.message || "Errore aggiornamento animale" },
        { status: 500 }
      );
    }

    const existingClaimResult = await admin
      .from("animal_owner_claims")
      .select("id, claim_token, used_at, created_at")
      .eq("animal_id", animalId)
      .eq("email", email)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<ClaimRow>();

    if (existingClaimResult.error) {
      return NextResponse.json(
        { error: existingClaimResult.error.message || "Errore lettura claim" },
        { status: 500 }
      );
    }

    let token = existingClaimResult.data?.claim_token ?? null;

    if (!token) {
      token = crypto.randomUUID();

      const claimInsertResult = await admin
        .from("animal_owner_claims")
        .insert({
          animal_id: animalId,
          email,
          claim_token: token,
          created_by_user_id: user.id,
        })
        .select("id")
        .single();

      if (claimInsertResult.error) {
        return NextResponse.json(
          { error: claimInsertResult.error.message || "Errore creazione claim" },
          { status: 500 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;

    const claimLink = `${baseUrl}/claim/${token}?email=${encodeURIComponent(email)}`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || "UNIMALIA <no-reply@unimalia.it>";

    const emailResult = (await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Collega il tuo animale su UNIMALIA",
      html: `
        <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5; max-width: 640px; margin: 0 auto;">
          <p>
            ${clinicName ? `La clinica veterinaria <strong>${clinicName}</strong>` : "Una clinica veterinaria"}
            ti ha invitato a collegare il tuo animale su UNIMALIA.
          </p>
          <p><strong>${animal.name ?? "Il tuo animale"}</strong></p>
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
      console.error("[INVITE_OWNER_EMAIL_ERROR]", emailResult);

      return NextResponse.json(
        {
          error:
            emailResult.error?.message ||
            "Errore invio email",
        },
        { status: 500 }
      );
    }

    console.log("[INVITE_OWNER_EMAIL_SENT]", {
      animalId,
      email,
      claimLink,
      resendId: emailResult?.data?.id ?? null,
    });

    return NextResponse.json({
      ok: true,
      claimLink,
    });
  } catch (error: unknown) {
    console.error("[INVITE_OWNER_ROUTE_ERROR]", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    );
  }
}