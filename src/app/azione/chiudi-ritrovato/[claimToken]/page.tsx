import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_NO_REPLY, getBaseUrl } from "@/lib/email/resend";
import { inviteToRegisterAfterFoundEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

export default async function ChiudiRitrovatoPage({
  params,
}: {
  params: { claimToken: string };
}) {
  const token = params.claimToken;
  const admin = supabaseAdmin();

  const { data: report, error: repErr } = await admin
    .from("reports")
    .select("id, contact_email, email_verified, animal_name")
    .eq("claim_token", token)
    .single();

  if (repErr || !report) {
    return (
      <div style={{ padding: 24 }}>
        Token non valido o annuncio inesistente.
      </div>
    );
  }

  const { error: updErr } = await admin
    .from("reports")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", report.id);

  if (updErr) {
    return (
      <div style={{ padding: 24 }}>
        Errore aggiornamento annuncio: {updErr.message}
      </div>
    );
  }

  try {
    if (report.contact_email && report.email_verified) {
      const normalizedEmail = String(report.contact_email).trim().toLowerCase();

      const { data: existingProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      const alreadyRegistered = !!existingProfile;

      const registerUrl = alreadyRegistered
        ? `${getBaseUrl()}/identita/nuovo`
        : `${getBaseUrl()}/login?mode=signup&next=/identita/nuovo`;

      const donateUrl =
        process.env.STRIPE_DONATION_URL ||
        process.env.NEXT_PUBLIC_STRIPE_DONATION_URL ||
        null;

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

  redirect(`/annuncio/${report.id}`);
}