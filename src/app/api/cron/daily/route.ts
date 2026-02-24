import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, getBaseUrl } from "@/lib/email/resend";
import {
  expiringSoonEmail,
  askIfFoundEmail,
  inviteToRegisterAfterFoundEmail,
} from "@/lib/email/templates";

function isAuthorized(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  return secret && secret === process.env.CRON_SECRET;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseUrl = getBaseUrl();
  const now = new Date();

  // 1) In scadenza tra 3 giorni
  const in3days = new Date(now.getTime() + 3 * 24 * 3600 * 1000);

  const { data: expiring } = await supabaseAdmin
    .from("reports")
    .select("id, title, contact_email, claim_token, expires_at")
    .eq("email_verified", true)
    .eq("status", "active")
    .lte("expires_at", in3days.toISOString())
    .gte("expires_at", now.toISOString());

  for (const r of expiring || []) {
    const manageUrl = `${baseUrl}/gestisci/${r.claim_token}`;
    const email = expiringSoonEmail({ reportTitle: r.title, manageUrl, daysLeft: 3 });

    await resend.emails.send({
      from: process.env.EMAIL_FROM_NO_REPLY!,
      to: r.contact_email,
      subject: email.subject,
      html: email.html,
    });
  }

  // 2) Dopo 10 giorni chiedi se è stato ritrovato (solo LOST)
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 3600 * 1000);

  const { data: tenDayLost } = await supabaseAdmin
    .from("reports")
    .select("title, contact_email, claim_token, created_at")
    .eq("email_verified", true)
    .eq("status", "active")
    .eq("type", "lost")
    .lte("created_at", tenDaysAgo.toISOString());

  for (const r of tenDayLost || []) {
    const closeFoundUrl = `${baseUrl}/azione/chiudi-ritrovato/${r.claim_token}`;
    const keepActiveUrl = `${baseUrl}/gestisci/${r.claim_token}`;
    const email = askIfFoundEmail({
      reportTitle: r.title,
      closeFoundUrl,
      keepActiveUrl,
    });

    await resend.emails.send({
      from: process.env.EMAIL_FROM_NO_REPLY!,
      to: r.contact_email,
      subject: email.subject,
      html: email.html,
    });
  }

  // 3) Invito registrazione 48h dopo chiusura come ritrovato
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 3600 * 1000);

  const { data: recentlyClosed } = await supabaseAdmin
    .from("reports")
    .select("contact_email, closed_at")
    .eq("email_verified", true)
    .eq("status", "closed_found")
    .gte("closed_at", twoDaysAgo.toISOString());

  for (const r of recentlyClosed || []) {
    const registerUrl = `${baseUrl}/registrati`;
    const email = inviteToRegisterAfterFoundEmail({ registerUrl });

    await resend.emails.send({
      from: process.env.EMAIL_FROM_NO_REPLY!,
      to: r.contact_email,
      subject: email.subject,
      html: email.html,
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}