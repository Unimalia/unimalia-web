import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_MESSAGES, getBaseUrl } from "@/lib/email/resend";
import { newMessageRelayEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

function hashIp(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const admin = supabaseAdmin();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ip_hash = hashIp(ip);

    const body = await req.json().catch(() => ({}));

    const report_id = String(body?.report_id || "").trim();
    const sender_email = String(body?.sender_email || "").trim().toLowerCase();
    const message = String(body?.message || "").trim();

    if (!report_id || !sender_email || !message) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    if (!isValidEmail(sender_email)) {
      return NextResponse.json({ error: "Email non valida" }, { status: 400 });
    }

    if (message.length < 5) {
      return NextResponse.json({ error: "Messaggio troppo corto" }, { status: 400 });
    }

    if (message.length > 3000) {
      return NextResponse.json({ error: "Messaggio troppo lungo" }, { status: 400 });
    }

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const { count, error: countErr } = await admin
      .from("report_messages")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ip_hash)
      .gte("created_at", since);

    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 400 });
    }

    if ((count || 0) >= 10) {
      return NextResponse.json(
        { error: "Limite messaggi raggiunto. Riprova più tardi." },
        { status: 429 }
      );
    }

    const { data: report, error: repErr } = await admin
      .from("reports")
      .select("id, title, contact_email, email_verified, status")
      .eq("id", report_id)
      .single();

    if (repErr || !report || !report.email_verified || report.status !== "active") {
      return NextResponse.json({ error: "Annuncio non disponibile" }, { status: 404 });
    }

    const { error: insErr } = await admin.from("report_messages").insert([
      {
        report_id,
        sender_email,
        message,
        ip_hash,
      },
    ]);

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }

    const reportUrl = `${getBaseUrl()}/annuncio/${report_id}`;
    const email = newMessageRelayEmail({
      reportTitle: report.title,
      reportUrl,
      senderEmail: sender_email,
      message,
    });

    await resend.emails.send({
      from: EMAIL_FROM_MESSAGES,
      to: report.contact_email,
      subject: email.subject,
      html: email.html,
      replyTo: sender_email,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Errore server" },
      { status: 500 }
    );
  }
}