import { NextResponse } from "next/server";
import { resend, EMAIL_FROM_MESSAGES, getBaseUrl } from "@/lib/email/resend";
import { protectedConversationEmail } from "@/lib/email/templates";
import { supabaseAdmin } from "@/lib/supabase/server";

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

    let conversationId: string | null = null;
    let ownerToken: string | null = null;

    const { data: existingConversation } = await admin
      .from("report_conversations")
      .select("id, requester_token, owner_token")
      .eq("report_id", report.id)
      .eq("requester_email", senderEmail)
      .maybeSingle();

    if (existingConversation) {
      conversationId = existingConversation.id;
      ownerToken = existingConversation.owner_token;
    } else {
      const { data: createdConversation, error: conversationError } = await admin
        .from("report_conversations")
        .insert({
          report_id: report.id,
          owner_email: report.contact_email,
          requester_email: senderEmail,
        })
        .select("id, requester_token, owner_token")
        .single();

      if (conversationError || !createdConversation) {
        return NextResponse.json(
          { error: conversationError?.message || "Errore creazione conversazione." },
          { status: 500 }
        );
      }

      conversationId = createdConversation.id;
      ownerToken = createdConversation.owner_token;
    }

    const { error: messageInsertError } = await admin
      .from("report_conversation_messages")
      .insert({
        conversation_id: conversationId,
        sender_role: "requester",
        sender_email: senderEmail,
        message,
      });

    if (messageInsertError) {
      return NextResponse.json({ error: messageInsertError.message }, { status: 500 });
    }

    await admin
      .from("report_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    const reportUrl = `${getBaseUrl()}/annuncio/${report.id}`;
    const ownerConversationUrl = `${getBaseUrl()}/messaggi-protetti/${ownerToken}`;

    const email = protectedConversationEmail({
      heading: "Hai un nuovo messaggio protetto",
      reportTitle: report.title || "Annuncio UNIMALIA",
      reportUrl,
      message,
      conversationUrl: ownerConversationUrl,
    });

    await resend.emails.send({
      from: EMAIL_FROM_MESSAGES,
      to: report.contact_email,
      subject: email.subject,
      html: email.html,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Errore server";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}