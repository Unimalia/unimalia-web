import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_NO_REPLY } from "@/lib/email/resend";

type ContactBody = {
  report_id?: string;
  message?: string;
  sender_email?: string;
};

type ReportContactRow = {
  contact_email: string | null;
  title: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContactBody;

    const { report_id, message, sender_email } = body;

    if (!report_id || !message || !sender_email) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: report, error } = await admin
      .from("reports")
      .select("contact_email, title")
      .eq("id", report_id)
      .single<ReportContactRow>();

    if (error || !report?.contact_email) {
      return NextResponse.json({ error: "Annuncio non valido" }, { status: 404 });
    }

    await resend.emails.send({
      from: EMAIL_FROM_NO_REPLY,
      to: report.contact_email,
      subject: `Nuovo messaggio per: ${report.title}`,
      replyTo: sender_email,
      html: `
        <p>Hai ricevuto un nuovo messaggio su UNIMALIA:</p>

        <p style="margin-top:12px;"><b>Messaggio:</b></p>
        <p>${message}</p>

        <hr style="margin:20px 0;" />

        <p>
          Puoi rispondere direttamente a questa email per contattare la persona.
        </p>

        <p style="font-size:12px;color:#666;">
          UNIMALIA protegge i tuoi dati: la tua email non è stata condivisa.
        </p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore server" },
      { status: 500 }
    );
  }
}