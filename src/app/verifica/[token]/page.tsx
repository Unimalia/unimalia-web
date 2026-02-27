// src/app/verifica/[token]/page.tsx
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, getBaseUrl } from "@/lib/email/resend";
import { reportPublishedEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: { token: string } }) {
  const token = params.token;

  const admin = supabaseAdmin();

  const { data: report, error } = await admin
    .from("reports")
    .select("id, title, contact_email, email_verified")
    .eq("verify_token", token)
    .single();

  if (error || !report) {
    return <div style={{ padding: 24 }}>Token non valido o annuncio inesistente.</div>;
  }

  if (!report.email_verified) {
    const { error: updErr } = await admin
      .from("reports")
      .update({ email_verified: true })
      .eq("id", report.id);

    if (!updErr) {
      const reportUrl = `${getBaseUrl()}/annuncio/${report.id}`;
      const email = reportPublishedEmail({ reportUrl, reportTitle: report.title });

      await resend.emails.send({
        from: process.env.EMAIL_FROM_NO_REPLY!,
        to: report.contact_email,
        subject: email.subject,
        html: email.html,
      });
    }
  }

  redirect(`/annuncio/${report.id}`);
}