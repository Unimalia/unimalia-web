import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_NO_REPLY, getBaseUrl } from "@/lib/email/resend";
import { inviteToRegisterAfterFoundEmail } from "@/lib/email/templates";

const CANDIDATE_CLOSED_STATUSES = [
  "closed",
  "found",
  "resolved",
  "inactive",
  "archived",
] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Token mancante." }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: report, error } = await admin
      .from("reports")
      .select("id, status, type, contact_email, claim_token")
      .eq("claim_token", token)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: "Annuncio non valido." }, { status: 404 });
    }

    if (report.type !== "lost") {
      return NextResponse.json(
        { error: "Questa azione è disponibile solo per gli smarrimenti." },
        { status: 400 }
      );
    }

    if (report.status !== "active") {
      return NextResponse.json({ ok: true, already: true, status: report.status });
    }

    let appliedStatus: string | null = null;
    let lastErrorMessage = "";

    for (const candidate of CANDIDATE_CLOSED_STATUSES) {
      const { error: updateError } = await admin
        .from("reports")
        .update({ status: candidate })
        .eq("id", report.id)
        .eq("status", "active");

      if (!updateError) {
        appliedStatus = candidate;
        break;
      }

      lastErrorMessage = updateError.message || "";
      if (!lastErrorMessage.toLowerCase().includes("invalid input value for enum")) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    }

    if (!appliedStatus) {
      return NextResponse.json(
        {
          error:
            "Non sono riuscito a chiudere l’annuncio perché il valore di stato previsto dal database non è tra quelli supportati dal sito al momento.",
        },
        { status: 400 }
      );
    }

    if (report.contact_email) {
      try {
        const registerUrl = `${getBaseUrl()}/login?mode=signup&returnTo=%2Fidentita`;
        const email = inviteToRegisterAfterFoundEmail({
          registerUrl,
          alreadyRegistered: false,
          donateUrl: null,
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
      status: appliedStatus,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Errore server" },
      { status: 500 }
    );
  }
}