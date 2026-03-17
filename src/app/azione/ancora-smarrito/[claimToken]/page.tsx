import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function addDaysIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export default async function AncoraSmarritoPage({
  params,
}: {
  params: { claimToken: string };
}) {
  const token = params.claimToken;
  const admin = supabaseAdmin();

  const { data: report, error: repErr } = await admin
    .from("reports")
    .select("id")
    .eq("claim_token", token)
    .single();

  if (repErr || !report) {
    return <div style={{ padding: 24 }}>Token non valido o annuncio inesistente.</div>;
  }

  const { error: updErr } = await admin
    .from("reports")
    .update({
      status: "active",
      closed_at: null,
      expires_at: addDaysIso(30),
    })
    .eq("id", report.id);

  if (updErr) {
    return <div style={{ padding: 24 }}>Errore aggiornamento annuncio: {updErr.message}</div>;
  }

  redirect(`/annuncio/${report.id}`);
}