import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, getBaseUrl } from "@/lib/email/resend";
import { newMessageRelayEmail } from "@/lib/email/templates";

function hashIp(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ip_hash = hashIp(ip);

  const body = await req.json();
  const { report_id, sender_email, message } = body;

  if (!report_id || !sender_email || !message) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  // Rate limit messaggi: max 10 / 24h per ip_hash
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("report_messages")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ip_hash)
    .gte("created_at", since);

  if ((count || 0) >= 10) {
    return NextResponse.json({ error: "Limite messaggi raggiunto. Riprova più tardi." }, { status: 429 });
  }

  const { data: report, error } = await supabaseAdmin
    .from("reports")
    .select("id, title, contact_email, email_verified")
    .eq("id", report_id)
    .single();

  if (error || !report || !report.email_verified) {
    return NextResponse.json({ error: "Annuncio non disponibile" }, { status: 404 });
  }

  await supabaseAdmin.from("report_messages").insert([
    { report_id, sender_email, message, ip_hash },
  ]);

  const reportUrl = `${getBaseUrl()}/annuncio/${report_id}`;
  const email = newMessageRelayEmail({
    reportTitle: report.title,
    reportUrl,
    senderEmail: sender_email,
    message,
  });

  await resend.emails.send({
    from: process.env.EMAIL_FROM_MESSAGES!,
    to: report.contact_email,
    subject: email.subject,
    html: email.html,
    replyTo: sender_email,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}