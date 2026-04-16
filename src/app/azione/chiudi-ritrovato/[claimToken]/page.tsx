import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_NO_REPLY, getBaseUrl } from "@/lib/email/resend";
import { inviteToRegisterAfterFoundEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

const FOUND_STATUS = "closed_found";

export default async function ChiudiRitrovatoPage({
  params,
}: {
  params: Promise<{ claimToken: string }>;
}) {
  const { claimToken } = await params;
  const token = claimToken;
  const admin = supabaseAdmin();

  const { data: report, error: repErr } = await admin
    .from("reports")
    .select("id, contact_email, created_by_user_id, animal_id, status, type")
    .eq("claim_token", token)
    .single();

  if (repErr || !report) {
    return <div style={{ padding: 24 }}>Token non valido o annuncio inesistente.</div>;
  }

  if (report.type !== "lost") {
    return <div style={{ padding: 24 }}>Questa azione è disponibile solo per gli smarrimenti.</div>;
  }

  if (report.status !== FOUND_STATUS) {
    const { error: updErr } = await admin
      .from("reports")
      .update({
        status: FOUND_STATUS,
      })
      .eq("id", report.id);

    if (updErr) {
      return <div style={{ padding: 24 }}>Errore aggiornamento annuncio: {updErr.message}</div>;
    }
  }

  if (report.animal_id) {
    await admin
      .from("animals")
      .update({ status: "home" })
      .eq("id", report.animal_id);
  }

  try {
    if (report.contact_email) {
      const normalizedEmail = String(report.contact_email).trim().toLowerCase();

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
        to: normalizedEmail,
        subject: email.subject,
        html: email.html,
      });
    }
  } catch (mailErr) {
    console.error("FOUND FOLLOWUP EMAIL ERROR:", mailErr);
  }

  redirect(`/gestisci-annuncio/${token}`);
}