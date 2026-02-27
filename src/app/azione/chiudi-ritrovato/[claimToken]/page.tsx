// src/app/azione/chiudi-ritrovato/[claimToken]/page.tsx
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChiudiRitrovatoPage({
  params,
}: {
  params: { claimToken: string };
}) {
  const token = params.claimToken;

  const admin = supabaseAdmin(); // ✅ FIX: supabaseAdmin() client

  // 1) Trova report tramite claim_token
  const { data: report, error: repErr } = await admin
    .from("reports")
    .select("id")
    .eq("claim_token", token)
    .single();

  if (repErr || !report) {
    return (
      <div style={{ padding: 24 }}>
        Token non valido o annuncio inesistente.
      </div>
    );
  }

  // 2) Chiudi (o marca come “ritrovato/chiuso”)
  // ⚠️ qui NON invento campi: se nel tuo schema hai "status" o "closed_at" ecc,
  // metti quelli. Io uso "status" se esiste, altrimenti cambia.
  const { error: updErr } = await admin
    .from("reports")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", report.id);

  // Se nel DB non esistono status/closed_at -> ti darà errore runtime, non build.
  // In tal caso dimmi quali colonne hai in "reports" e lo metto corretto.
  if (updErr) {
    return (
      <div style={{ padding: 24 }}>
        Errore aggiornamento annuncio: {updErr.message}
      </div>
    );
  }

  redirect(`/annuncio/${report.id}`);
}