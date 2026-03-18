import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_NO_REPLY, getBaseUrl } from "@/lib/email/resend";
import { newMessageRelayEmail } from "@/lib/email/templates";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const reportId = typeof body?.report_id === "string" ? body.report_id.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const senderEmail =
      typeof body?.sender_email === "string" ? body.sender_email.trim().toLowerCase() : "";
    const website = typeof body?.website === "string" ? body.website.trim() : "";

    if (website) {
      return NextResponse.json({ error: "Invio non valido" }, { status: 400 });
    }

    if (!reportId || !message || !senderEmail) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    if (!isValidEmail(senderEmail)) {
      return NextResponse.json({ error: "Email non valida" }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json({ error: "Messaggio troppo corto" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: report, error } = await admin
      .from("reports")
      .select("id, title, contact_email, status")
      .eq("id", reportId)
      .single();

    if (error || !report?.contact_email) {
      return NextResponse.json({ error: "Annuncio non valido" }, { status: 404 });
    }

    if (report.status !== "active") {
      return NextResponse.json(
        { error: "Questo annuncio non è più attivo." },
        { status: 400 }
      );
    }

    const reportUrl = `${getBaseUrl()}/annuncio/${report.id}`;
    const email = newMessageRelayEmail({
      reportTitle: report.title || "Annuncio UNIMALIA",
      reportUrl,
      senderEmail,
      message,
    });

    await resend.emails.send({
      from: EMAIL_FROM_NO_REPLY,
      to: report.contact_email,
      subject: email.subject,
      replyTo: senderEmail,
      html: email.html,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Errore server" },
      { status: 500 }
    );
  }
}