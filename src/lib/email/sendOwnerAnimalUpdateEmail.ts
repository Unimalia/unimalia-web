import crypto from "crypto";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendOwnerAnimalUpdateEmailInput = {
  animalId: string;
  eventTitle: string;
  eventDate?: string | null;
  eventNotes?: string | null;

  action?: "created" | "updated" | "deleted";
  eventType?: string | null;
  visibility?: "owner" | "professionals" | "emergency" | null;
  source?: "owner" | "professional" | "veterinarian" | null;
  priority?: "low" | "normal" | "high" | "urgent" | null;
  weightKg?: number | null;
  therapyStartDate?: string | null;
  therapyEndDate?: string | null;
  vetSignature?: string | null;
  meta?: Record<string, any> | null;

  /**
   * Per ora gestiamo allegati come link.
   * Quando mi mandi il punto esatto dove salvi i file,
   * possiamo trasformarli in allegati veri o link firmati.
   */
  attachments?: Array<{
    name: string;
    url: string;
  }> | null;
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

const LOGO_URL = "https://unimalia.it/logo-unimalia.png";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function labelForAction(action: SendOwnerAnimalUpdateEmailInput["action"]) {
  switch (action) {
    case "updated":
      return "ha aggiornato un evento sanitario";
    case "deleted":
      return "ha annullato un evento sanitario";
    case "created":
    default:
      return "ha registrato un nuovo evento sanitario";
  }
}

function subjectForAction(
  action: SendOwnerAnimalUpdateEmailInput["action"],
  animalName: string | null
) {
  const safeAnimalName = animalName ?? "animale";

  switch (action) {
    case "updated":
      return `Aggiornamento evento clinico: ${safeAnimalName}`;
    case "deleted":
      return `Evento clinico annullato: ${safeAnimalName}`;
    case "created":
    default:
      return `Aggiornamento scheda clinica: ${safeAnimalName}`;
  }
}

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function renderDetailRow(label: string, value: unknown) {
  const normalized = normalizeValue(value);
  if (!normalized) return "";
  return `
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600; width: 180px;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">
        ${escapeHtml(normalized)}
      </td>
    </tr>
  `;
}

function renderMetaRows(meta: Record<string, any> | null | undefined) {
  if (!meta || typeof meta !== "object") return "";

  const excludedKeys = new Set([
    "therapy_start_date",
    "therapy_end_date",
    "priority",
    "weight_kg",
    "created_by_member_label",
    "created_by_member_id",
  ]);

  const rows = Object.entries(meta)
    .filter(([key, value]) => !excludedKeys.has(key) && value !== null && value !== undefined && value !== "")
    .map(([key, value]) => {
      let printable: string;

      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        printable = String(value);
      } else {
        printable = JSON.stringify(value);
      }

      return renderDetailRow(`Meta · ${key}`, printable);
    })
    .join("");

  return rows;
}

function renderAttachments(
  attachments: SendOwnerAnimalUpdateEmailInput["attachments"]
) {
  if (!attachments || attachments.length === 0) return "";

  const items = attachments
    .filter((item) => item?.name && item?.url)
    .map(
      (item) => `
        <li style="margin-bottom: 6px;">
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(item.name)}
          </a>
        </li>
      `
    )
    .join("");

  if (!items) return "";

  return `
    <div style="margin-top: 24px;">
      <p style="font-weight: 700; margin-bottom: 8px;">Allegati</p>
      <ul style="padding-left: 18px; margin: 0;">
        ${items}
      </ul>
    </div>
  `;
}

export async function sendOwnerAnimalUpdateEmail(
  input: SendOwnerAnimalUpdateEmailInput
) {
  const {
    animalId,
    eventTitle,
    eventDate = null,
    eventNotes = null,
    action = "created",
    eventType = null,
    visibility = null,
    source = null,
    priority = null,
    weightKg = null,
    therapyStartDate = null,
    therapyEndDate = null,
    vetSignature = null,
    meta = null,
    attachments = null,
  } = input;

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

  const detailsRows = [
    renderDetailRow("Animale", animal.name ?? "il tuo animale"),
    renderDetailRow("Evento", eventTitle),
    renderDetailRow("Tipo evento", eventType),
    renderDetailRow("Data evento", eventDate),
    renderDetailRow("Visibilità", visibility),
    renderDetailRow("Origine", source),
    renderDetailRow("Priorità", priority),
    renderDetailRow("Peso (kg)", weightKg),
    renderDetailRow("Inizio terapia", therapyStartDate),
    renderDetailRow("Fine terapia", therapyEndDate),
    renderDetailRow("Firma veterinario", vetSignature),
    renderMetaRows(meta),
  ]
    .filter(Boolean)
    .join("");

  const notesBlock = eventNotes
    ? `
      <div style="margin-top: 24px;">
        <p style="font-weight: 700; margin-bottom: 8px;">Note</p>
        <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; white-space: pre-wrap;">
          ${escapeHtml(eventNotes)}
        </div>
      </div>
    `
    : "";

  const attachmentsBlock = renderAttachments(attachments);

  const html = `
    <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5; max-width: 720px; margin: 0 auto;">
      <div style="margin-bottom: 24px;">
        <img src="${LOGO_URL}" alt="UNIMALIA" style="max-height: 56px;" />
      </div>

      <p>
        La clinica veterinaria ${labelForAction(action)} per
        <strong>${escapeHtml(animal.name ?? "il tuo animale")}</strong>.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 18px;">
        ${detailsRows}
      </table>

      ${notesBlock}
      ${attachmentsBlock}

      ${inviteBlock ? `<div style="margin-top: 24px;">${inviteBlock}</div>` : ""}

      <hr style="margin: 24px 0; border: 0; border-top: 1px solid #ddd;" />

      <p style="font-size: 12px; color: #666;">
        Questa è una comunicazione di servizio relativa alla scheda sanitaria dell’animale.
      </p>
    </div>
  `;

  const emailResult = await resend.emails.send({
    from: "UNIMALIA <onboarding@resend.dev>",
    to: destinationEmail,
    subject: subjectForAction(action, animal.name),
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