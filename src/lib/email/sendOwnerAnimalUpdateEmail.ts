import crypto from "crypto";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendOwnerAnimalUpdateEmailInput = {
  animalId: string;
  eventTitle: string;
  eventDate?: string | null;
  eventNotes?: string | null;
};

type AnimalEmailRow = {
  id: string;
  name: string | null;
  owner_id: string | null;
  owner_claim_status: "none" | "pending" | "claimed" | null;
  pending_owner_email: string | null;
  invite_email_count: number | null;
};

type OwnerProfileRow = {
  id: string;
  email?: string | null;
};

const LOGO_URL =
  "https://unimalia.it/logo-unimalia.png"; // metti qui il path reale del logo

export async function sendOwnerAnimalUpdateEmail(
  input: SendOwnerAnimalUpdateEmailInput
) {
  const { animalId, eventTitle, eventDate = null, eventNotes = null } = input;

  const admin = supabaseAdmin();

  const animalResult = await admin
    .from("animals")
    .select(`
      id,
      name,
      owner_id,
      owner_claim_status,
      pending_owner_email,
      invite_email_count
    `)
    .eq("id", animalId)
    .single();

  if (animalResult.error || !animalResult.data) {
    throw new Error("Animale non trovato per invio email aggiornamento");
  }

  const animal = animalResult.data as AnimalEmailRow;

  let destinationEmail: string | null = null;
  let claimLink: string | null = null;
  let inviteBlock = "";
  const inviteCount = animal.invite_email_count ?? 0;

  if (animal.owner_id) {
    const ownerProfileResult = await admin
      .from("profiles")
      .select("id, email")
      .eq("id", animal.owner_id)
      .maybeSingle();

    const ownerProfile = ownerProfileResult.data as OwnerProfileRow | null;
    destinationEmail = ownerProfile?.email ?? null;
  } else if (animal.pending_owner_email) {
    destinationEmail = animal.pending_owner_email;

    if (inviteCount < 3) {
      const token = crypto.randomUUID();

      const claimInsert = await admin
        .from("animal_owner_claims")
        .insert({
          animal_id: animal.id,
          email: destinationEmail,
          claim_token: token,
          created_by: null,
        })
        .select("id")
        .single();

      if (claimInsert.error) {
        throw new Error(
          claimInsert.error.message || "Errore creazione claim token"
        );
      }

      const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
      claimLink = `${baseUrl}/claim/${token}`;

      if (inviteCount === 0) {
        inviteBlock = `
          <p>La cartella sanitaria dell’animale è gestita tramite UNIMALIA.</p>
          <p>Puoi registrarti per consultare la scheda completa e gestire i promemoria sanitari.</p>
          <p><a href="${claimLink}">${claimLink}</a></p>
        `;
      } else if (inviteCount === 1) {
        inviteBlock = `
          <p>Puoi collegare l’animale al tuo account UNIMALIA da qui:</p>
          <p><a href="${claimLink}">${claimLink}</a></p>
        `;
      } else if (inviteCount === 2) {
        inviteBlock = `
          <p>Ultimo invito per collegare l’animale al tuo account UNIMALIA:</p>
          <p><a href="${claimLink}">${claimLink}</a></p>
        `;
      }

      await admin
        .from("animals")
        .update({
          invite_email_count: inviteCount + 1,
        })
        .eq("id", animal.id);
    }
  }

  if (!destinationEmail) {
    return { skipped: true, reason: "no_destination_email" as const };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">
      <div style="margin-bottom: 24px;">
        <img src="${LOGO_URL}" alt="UNIMALIA" style="max-height: 56px;" />
      </div>

      <p>La clinica veterinaria ha registrato un nuovo evento sanitario per <strong>${animal.name ?? "il tuo animale"}</strong>.</p>
      <p><strong>Evento:</strong> ${eventTitle}</p>
      ${eventDate ? `<p><strong>Data:</strong> ${eventDate}</p>` : ""}
      ${eventNotes ? `<p><strong>Note:</strong> ${eventNotes}</p>` : ""}

      ${inviteBlock}

      <hr style="margin: 24px 0; border: 0; border-top: 1px solid #ddd;" />

      <p style="font-size: 12px; color: #666;">
        Questa è una comunicazione di servizio relativa alla scheda sanitaria dell’animale.
      </p>
    </div>
  `;

  const emailResult = await resend.emails.send({
    from: "UNIMALIA <onboarding@resend.dev>",
    to: destinationEmail,
    subject: `Aggiornamento scheda clinica: ${animal.name ?? "animale"}`,
    html,
  });

  if ((emailResult as { error?: { message?: string } })?.error) {
    throw new Error(
      (emailResult as { error?: { message?: string } }).error?.message ||
        "Errore invio email aggiornamento"
    );
  }

  return { ok: true as const };
}