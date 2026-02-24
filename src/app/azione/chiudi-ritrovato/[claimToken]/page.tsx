import { supabaseAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CloseFoundPage({ params }: { params: { claimToken: string } }) {
  const token = params.claimToken;

  const { data: report } = await supabaseAdmin
    .from("reports")
    .select("id")
    .eq("claim_token", token)
    .single();

  if (!report) {
    return <div style={{ padding: 24 }}>Link non valido.</div>;
  }

  await supabaseAdmin
    .from("reports")
    .update({ status: "closed_found", closed_at: new Date().toISOString() })
    .eq("id", report.id);

  redirect(`/lieti-fine`); // oppure redirect alla pagina annuncio se preferisci
}