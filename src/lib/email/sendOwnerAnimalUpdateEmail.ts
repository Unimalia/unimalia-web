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
};

type OwnerProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

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
      pending_owner_email
    `)
    .eq("id", animalId)
    .single();

  if (animalResult.error || !animalResult.data) {
    throw new Error("Animale non trovato per invio email aggiornamento");
  }

  const animal = animalResult.data as AnimalEmailRow;

  let destinationEmail: string | null = null;
  let claimLink: string | null = null;

  if (animal.owner_id) {
    const ownerProfileResult = await admin
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", animal.owner_id)
      .maybeSingle();

    const ownerProfile = ownerProfileResult.data as OwnerProfileRow | null;
    destinationEmail = ownerProfile?.email ?? null;
  } else if (animal.pending_owner_email) {
    destinationEmail = animal.pending_owner_email;

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
  }

  if (!destinationEmail) {
    return { skipped: true, reason: "no_destination_email" as const };
  }

  const html = `
    <p>La scheda clinica del tuo animale è stata aggiornata su UNIMALIA.</p>
    <p><strong>Animale:</strong> ${animal.name ?? "Animale"}</p>
    <p><strong>Evento:</strong> ${eventTitle}</p>
    ${eventDate ? `<p><strong>Data:</strong> ${eventDate}</p>` : ""}
    ${eventNotes ? `<p><strong>Note:</strong> ${eventNotes}</p>` : ""}
    ${
      claimLink
        ? `
      <hr />
      <p>Non hai ancora collegato questo animale al tuo account UNIMALIA.</p>
      <p>Puoi farlo da qui:</p>
      <p><a href="${claimLink}">${claimLink}</a></p>
    `
        : ""
    }
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