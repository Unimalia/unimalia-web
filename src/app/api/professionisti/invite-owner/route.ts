import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const admin = supabaseAdmin();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { animalId, email } = await req.json();

  if (!animalId || !email) {
    return NextResponse.json(
      { error: "animalId o email mancanti" },
      { status: 400 }
    );
  }

  const token = crypto.randomUUID();

  const insert = await admin.from("animal_owner_claims").insert({
    animal_id: animalId,
    email,
    claim_token: token,
    created_by: user.id,
  });

  if (insert.error) {
    return NextResponse.json(
      { error: insert.error.message },
      { status: 500 }
    );
  }

  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/a/${token}`;

  // email
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/test-email`, {
    method: "POST",
    body: JSON.stringify({
      to: email,
      subject: "Collega il tuo animale su UNIMALIA",
      html: `
        <p>Una clinica ha creato la scheda del tuo animale.</p>
        <p>Clicca qui per collegarlo al tuo account:</p>
        <p><a href="${link}">${link}</a></p>
      `,
    }),
  });

  return NextResponse.json({ ok: true });
}