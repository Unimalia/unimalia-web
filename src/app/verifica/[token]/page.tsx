import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_NO_REPLY, getBaseUrl } from "@/lib/email/resend";
import { reportPublishedEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function VerifyPage({ params }: PageProps) {
  const { token } = await params;

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
      const email = reportPublishedEmail({
        reportUrl,
        reportTitle: report.title,
      });

      try {
        await resend.emails.send({
          from: EMAIL_FROM_NO_REPLY,
          to: report.contact_email,
          subject: email.subject,
          html: email.html,
        });
      } catch (mailError) {
        console.error("REPORT PUBLISHED EMAIL ERROR:", mailError);
      }
    }
  }

  redirect(`/annuncio/${report.id}`);
}