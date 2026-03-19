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
  params: Promise<{ claimToken: string }>;
}) {
  const { claimToken } = await params;
  const token = claimToken;
  const admin = supabaseAdmin();

  const { data: report, error: repErr } = await admin
    .from("reports")
    .select("id, status")
    .eq("claim_token", token)
    .single();

  if (repErr || !report) {
    return <div style={{ padding: 24 }}>Token non valido o annuncio inesistente.</div>;
  }

  if (report.status !== "active") {
    const { error: updErr } = await admin
      .from("reports")
      .update({
        status: "active",
        expires_at: addDaysIso(30),
      })
      .eq("id", report.id);

    if (updErr) {
      return <div style={{ padding: 24 }}>Errore aggiornamento annuncio: {updErr.message}</div>;
    }
  } else {
    const { error: updErr } = await admin
      .from("reports")
      .update({
        expires_at: addDaysIso(30),
      })
      .eq("id", report.id);

    if (updErr) {
      return <div style={{ padding: 24 }}>Errore aggiornamento annuncio: {updErr.message}</div>;
    }
  }

  redirect(`/gestisci-annuncio/${token}`);
}