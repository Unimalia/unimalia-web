import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_NO_REPLY } from "@/lib/email/resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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
      return NextResponse.json(
        { error: "Messaggio troppo corto" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    const { data: report, error } = await admin
      .from("reports")
      .select("id, title, contact_email, status, type")
      .eq("id", reportId)
      .single();

    if (error || !report?.contact_email) {
      return NextResponse.json({ error: "Annuncio non valido" }, { status: 404 });
    }

    if (report.status && report.status !== "active") {
      return NextResponse.json(
        { error: "Questo annuncio non è più attivo" },
        { status: 400 }
      );
    }

    const safeTitle = escapeHtml(report.title || "Annuncio UNIMALIA");
    const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
    const safeSender = escapeHtml(senderEmail);

    await resend.emails.send({
      from: EMAIL_FROM_NO_REPLY,
      to: report.contact_email,
      subject: `Nuovo messaggio per il tuo annuncio su UNIMALIA`,
      replyTo: senderEmail,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6;">
          <p>Hai ricevuto un nuovo messaggio relativo al tuo annuncio su <b>UNIMALIA</b>.</p>

          <p style="margin-top:16px;"><b>Annuncio:</b> ${safeTitle}</p>
          <p><b>Email mittente:</b> ${safeSender}</p>

          <p style="margin-top:16px;"><b>Messaggio:</b></p>
          <div style="padding:12px;border:1px solid #e4e4e7;border-radius:12px;background:#fafafa;">
            ${safeMessage}
          </div>

          <p style="margin-top:20px;">
            Puoi rispondere direttamente a questa email per contattare la persona.
          </p>

          <p style="font-size:12px;color:#666;margin-top:24px;">
            UNIMALIA protegge i tuoi dati: il tuo indirizzo email non viene mostrato pubblicamente.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Errore server" },
      { status: 500 }
    );
  }
}