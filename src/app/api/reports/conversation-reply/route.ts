import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_MESSAGES, getBaseUrl } from "@/lib/email/resend";
import { protectedConversationEmail } from "@/lib/email/templates";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const website = typeof body?.website === "string" ? body.website.trim() : "";

    if (website) {
      return NextResponse.json({ error: "Invio non valido" }, { status: 400 });
    }

    if (!token || !message) {
      return NextResponse.json({ error: "Dati mancanti." }, { status: 400 });
    }

    if (message.length < 3) {
      return NextResponse.json({ error: "Messaggio troppo corto." }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: conversation, error } = await admin
      .from("report_conversations")
      .select(`
        id,
        report_id,
        owner_email,
        requester_email,
        owner_token,
        requester_token,
        reports:report_id ( id, title, status )
      `)
      .or(`owner_token.eq.${token},requester_token.eq.${token}`)
      .single();

    if (error || !conversation) {
      return NextResponse.json({ error: "Conversazione non valida." }, { status: 404 });
    }

    const report = Array.isArray(conversation.reports)
      ? conversation.reports[0]
      : conversation.reports;

    if (!report || report.status !== "active") {
      return NextResponse.json(
        { error: "L’annuncio non è più attivo. La conversazione è chiusa." },
        { status: 400 }
      );
    }

    const senderRole = conversation.owner_token === token ? "owner" : "requester";
    const senderEmail =
      senderRole === "owner" ? conversation.owner_email : conversation.requester_email;
    const recipientEmail =
      senderRole === "owner" ? conversation.requester_email : conversation.owner_email;
    const recipientToken =
      senderRole === "owner" ? conversation.requester_token : conversation.owner_token;

    const { error: insertError } = await admin
      .from("report_conversation_messages")
      .insert({
        conversation_id: conversation.id,
        sender_role: senderRole,
        sender_email: senderEmail,
        message,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await admin
      .from("report_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    const reportUrl = `${getBaseUrl()}/annuncio/${report.id}`;
    const recipientConversationUrl = `${getBaseUrl()}/messaggi-protetti/${recipientToken}`;

    const email = protectedConversationEmail({
      heading: "Nuova risposta nella conversazione protetta",
      reportTitle: report.title || "Annuncio UNIMALIA",
      reportUrl,
      message,
      conversationUrl: recipientConversationUrl,
    });

    await resend.emails.send({
      from: EMAIL_FROM_MESSAGES,
      to: recipientEmail,
      subject: email.subject,
      html: email.html,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Errore server." },
      { status: 500 }
    );
  }
}