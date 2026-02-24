import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, getBaseUrl } from "@/lib/email/resend";
import { verificationEmail } from "@/lib/email/templates";

function hashIp(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ip_hash = hashIp(ip);

  const body = await req.json();

  const {
    type, // lost|found|sighted
    title,
    animal_name,
    species,
    region,
    province,
    location_text,
    event_date, // YYYY-MM-DD
    description,
    photo_urls,
    contact_email,
    contact_phone,
    contact_mode, // protected|phone_public
    consent,
  } = body;

  if (!consent) return NextResponse.json({ error: "Consenso obbligatorio" }, { status: 400 });

  if (!type || !title || !species || !region || !province || !location_text || !event_date || !contact_email) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
  }

  // Rate limit semplice: max 3 annunci / 24h per ip_hash
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ip_hash)
    .gte("created_at", since);

  if ((count || 0) >= 3) {
    return NextResponse.json({ error: "Limite raggiunto. Riprova più tardi." }, { status: 429 });
  }

  const { data, error } = await supabaseAdmin
    .from("reports")
    .insert([
      {
        type,
        title,
        animal_name: animal_name || null,
        species,
        region,
        province,
        location_text,
        event_date,
        description: description || null,
        photo_urls: Array.isArray(photo_urls) ? photo_urls : [],
        contact_email,
        contact_phone: contact_phone || null,
        contact_mode: contact_mode || "protected",
        ip_hash,
        email_verified: false,
      },
    ])
    .select("id, verify_token, title, contact_email")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Errore creazione annuncio" }, { status: 500 });
  }

  const verifyUrl = `${getBaseUrl()}/verifica/${data.verify_token}`;
  const email = verificationEmail({ verifyUrl, reportTitle: data.title });

  await resend.emails.send({
    from: process.env.EMAIL_FROM_NO_REPLY!,
    to: data.contact_email,
    subject: email.subject,
    html: email.html,
  });

  return NextResponse.json({ ok: true, report_id: data.id }, { status: 200 });
}