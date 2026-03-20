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
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
};

const LOGO_URL = "https://unimalia.it/logo-unimalia.png";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://unimalia.it").replace(/\/$/, "");

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

function formatDateValue(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return raw;

    return dt.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

function priorityLabel(priority?: string | null) {
  switch (priority) {
    case "low":
      return "Bassa";
    case "normal":
      return "Normale";
    case "high":
      return "Alta";
    case "urgent":
      return "Urgente";
    default:
      return priority || null;
  }
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

  return Object.entries(meta)
    .filter(
      ([key, value]) =>
        !excludedKeys.has(key) &&
        value !== null &&
        value !== undefined &&
        value !== ""
    )
    .map(([key, value]) => {
      const printable =
        typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);

      return renderDetailRow(`Meta · ${key}`, printable);
    })
    .join("");
}

function renderAttachments(
  attachments: SendOwnerAnimalUpdateEmailInput["attachments"]
) {
  if (!attachments || attachments.length === 0) return "";

  const items = attachments
    .filter((item) => item?.name && item?.url)
    .map(
      (item) => `
        <li style="margin-bottom: 8px;">
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
      <ul style="padding-left: 18px; margin: 0 0 10px 0;">
        ${items}
      </ul>
      <p style="margin: 0; font-size: 12px; color: #666;">
        Si consiglia di scaricare gli allegati appena possibile, perché potrebbero non essere disponibili in futuro.
      </p>
    </div>
  `;
}

async function resolveOwnerEmail(ownerId: string): Promise<string | null> {
  const admin = supabaseAdmin();

  const ownerProfileResult = await admin
    .from("profiles")
    .select("id, email")
    .eq("id", ownerId)
    .maybeSingle();

  const ownerProfile = ownerProfileResult.data as OwnerProfileRow | null;
  const profileEmail =
    typeof ownerProfile?.email === "string" ? ownerProfile.email.trim() : "";

  if (profileEmail) {
    return profileEmail;
  }

  const authResp = await admin.auth.admin.getUserById(ownerId);
  const authEmail = authResp?.data?.user?.email?.trim() || null;

  return authEmail || null;
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
    destinationEmail = await resolveOwnerEmail(animal.owner_id);
  } else if (animal.pending_owner_email) {
    destinationEmail = animal.pending_owner_email.trim() || null;

    if (destinationEmail && inviteCount < 3) {
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
        throw new Error(claimInsert.error.message || "Errore creazione claim token");
      }

      claimLink = `${SITE_URL}/claim/${token}`;

      if (inviteCount === 0) {
        inviteBlock = `
          <p>Per maggiori informazioni puoi visitare il sito ufficiale UNIMALIA:</p>
          <p><a href="${SITE_URL}">${SITE_URL}</a></p>
        `;
      } else if (inviteCount === 1) {
        inviteBlock = `
          <p>Puoi consultare il sito ufficiale UNIMALIA qui:</p>
          <p><a href="${SITE_URL}">${SITE_URL}</a></p>
        `;
      } else if (inviteCount === 2) {
        inviteBlock = `
          <p>Sito ufficiale UNIMALIA:</p>
          <p><a href="${SITE_URL}">${SITE_URL}</a></p>
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
    return { skipped: true as const, reason: "no_destination_email" as const };
  }

  const displayOrigin = vetSignature || "Veterinario";
  const formattedEventDate = formatDateValue(eventDate);
  const formattedTherapyStartDate = formatDateValue(therapyStartDate);
  const formattedTherapyEndDate = formatDateValue(therapyEndDate);

  const detailsRows = [
    renderDetailRow("Animale", animal.name ?? "il tuo animale"),
    renderDetailRow("Evento", eventTitle),
    renderDetailRow("Tipo evento", eventType),
    renderDetailRow("Data evento", formattedEventDate),
    renderDetailRow("Professionista", displayOrigin),
    renderDetailRow("Priorità", priorityLabel(priority)),
    renderDetailRow("Peso (kg)", weightKg),
    renderDetailRow("Inizio terapia", formattedTherapyStartDate),
    renderDetailRow("Fine terapia", formattedTherapyEndDate),
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

  const logoBlock = `
    <div style="margin-bottom: 24px;">
      <img src="${LOGO_URL}" alt="UNIMALIA" style="max-height: 56px; display:block;" />
    </div>
  `;

  const siteBlock = `
    <div style="margin-top: 24px;">
      <p style="margin: 0 0 6px 0; font-weight: 700;">Sito ufficiale</p>
      <p style="margin: 0;">
        <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">${SITE_URL}</a>
      </p>
    </div>
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5; max-width: 720px; margin: 0 auto;">
      ${logoBlock}

      <p>
        La clinica veterinaria ${labelForAction(action)} per
        <strong>${escapeHtml(animal.name ?? "il tuo animale")}</strong>.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 18px;">
        ${detailsRows}
      </table>

      ${notesBlock}
      ${attachmentsBlock}
      ${siteBlock}
      ${inviteBlock ? `<div style="margin-top: 24px;">${inviteBlock}</div>` : ""}

      <hr style="margin: 24px 0; border: 0; border-top: 1px solid #ddd;" />

      <p style="font-size: 12px; color: #666; margin: 0 0 8px 0;">
        Questa è una comunicazione di servizio relativa alla scheda sanitaria dell’animale.
      </p>

      <p style="font-size: 12px; color: #666; margin: 0;">
        Se hai ricevuto questa email per errore, puoi ignorarla. Ti chiediamo di non inoltrare, copiare o utilizzare eventuali contenuti o allegati ricevuti.
      </p>
    </div>
  `;

  const emailResult = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "UNIMALIA <no-reply@unimalia.it>",
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