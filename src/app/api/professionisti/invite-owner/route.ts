import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const animalId = String(body?.animalId ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!animalId || !email) {
      return NextResponse.json(
        { error: "animalId o email mancanti" },
        { status: 400 }
      );
    }

    const orgLookup = await getProfessionalOrgId(user.id);

    if (!orgLookup.orgId) {
      return NextResponse.json(
        { error: "Profilo professionista non valido" },
        { status: 403 }
      );
    }

    const animalResult = await admin
      .from("animals")
      .select("id, name, created_by_org_id, origin_org_id")
      .eq("id", animalId)
      .single();

    if (animalResult.error || !animalResult.data) {
      return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
    }

    const animal = animalResult.data;

    const canAccess =
      animal.created_by_org_id === orgLookup.orgId ||
      animal.origin_org_id === orgLookup.orgId;

    if (!canAccess) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
    }

    const token = crypto.randomUUID();

    const claimInsert = await admin
      .from("animal_owner_claims")
      .insert({
        animal_id: animalId,
        email,
        claim_token: token,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (claimInsert.error) {
      return NextResponse.json(
        { error: claimInsert.error.message },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      req.nextUrl.origin;

    const claimLink = `${baseUrl}/claim/${token}`;

    const emailResult = await resend.emails.send({
      from: "UNIMALIA <onboarding@resend.dev>",
      to: email,
      subject: "Collega il tuo animale su UNIMALIA",
      html: `
        <p>Una clinica ha creato la scheda del tuo animale su UNIMALIA.</p>
        <p><strong>${animal.name ?? "Il tuo animale"}</strong></p>
        <p>Clicca qui per collegarlo al tuo account:</p>
        <p><a href="${claimLink}">${claimLink}</a></p>
      `,
    });

    if ((emailResult as any)?.error) {
      return NextResponse.json(
        { error: (emailResult as any).error.message || "Errore invio email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      claimLink,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Errore interno" },
      { status: 500 }
    );
  }
}