import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_NO_REPLY, getBaseUrl } from "@/lib/email/resend";
import { inviteToRegisterAfterFoundEmail } from "@/lib/email/templates";

const FOUND_STATUS = "closed_found";

type MarkFoundBody = {
  token?: string;
};

type ReportRow = {
  id: string;
  status: string | null;
  type: string | null;
  contact_email: string | null;
  claim_token: string | null;
  created_by_user_id: string | null;
  animal_id: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as MarkFoundBody;
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Token mancante." }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: report, error } = await admin
      .from("reports")
      .select("id, status, type, contact_email, claim_token, created_by_user_id, animal_id")
      .eq("claim_token", token)
      .single<ReportRow>();

    if (error || !report) {
      return NextResponse.json({ error: "Annuncio non valido." }, { status: 404 });
    }

    if (report.type !== "lost") {
      return NextResponse.json(
        { error: "Questa azione è disponibile solo per gli smarrimenti." },
        { status: 400 }
      );
    }

    if (report.status === FOUND_STATUS) {
      return NextResponse.json({ ok: true, already: true, status: report.status });
    }

    if (report.status !== "active") {
      return NextResponse.json(
        { error: "Questo annuncio non è più in uno stato aggiornabile da questa pagina." },
        { status: 400 }
      );
    }

    const { error: updateError } = await admin
      .from("reports")
      .update({ status: FOUND_STATUS })
      .eq("id", report.id)
      .eq("status", "active");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    if (report.animal_id) {
      await admin
        .from("animals")
        .update({ status: "home" })
        .eq("id", report.animal_id);
    }

    if (report.contact_email) {
      try {
        const registerUrl = `${getBaseUrl()}/login?mode=signup&returnTo=%2Fidentita`;
        const donateUrl =
          process.env.STRIPE_DONATION_URL ||
          process.env.NEXT_PUBLIC_STRIPE_DONATION_URL ||
          null;

        const alreadyRegistered = !!report.created_by_user_id;

        const email = inviteToRegisterAfterFoundEmail({
          registerUrl,
          alreadyRegistered,
          donateUrl,
        });

        await resend.emails.send({
          from: EMAIL_FROM_NO_REPLY,
          to: report.contact_email,
          subject: email.subject,
          html: email.html,
        });
      } catch (mailError) {
        console.error("AFTER FOUND EMAIL ERROR:", mailError);
      }
    }

    return NextResponse.json({
      ok: true,
      reportId: report.id,
      status: FOUND_STATUS,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore server" },
      { status: 500 }
    );
  }
}