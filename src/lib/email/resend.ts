import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export const EMAIL_FROM_NO_REPLY =
  process.env.EMAIL_FROM_NO_REPLY || "UNIMALIA <no-reply@unimalia.it>";

export const EMAIL_FROM_MESSAGES =
  process.env.EMAIL_FROM_MESSAGES || "UNIMALIA <messaggi@unimalia.it>";

export function getBaseUrl() {
  return process.env.PUBLIC_BASE_URL || "https://www.unimalia.it";
}

type SendReportCreatedEmailParams = {
  to: string;
  type: "lost" | "found" | "sighted";
  reportId: string;
  animalName?: string | null;
};

function getReportUrl(type: "lost" | "found" | "sighted", reportId: string) {
  const baseUrl = getBaseUrl();

  if (type === "lost") {
    return `${baseUrl}/annuncio/${reportId}`;
  }

  return `${baseUrl}/annuncio/${reportId}`;
}

function getTypeLabel(type: "lost" | "found" | "sighted") {
  if (type === "lost") return "smarrimento";
  if (type === "found") return "segnalazione di animale trovato";
  return "avvistamento";
}

export async function sendReportCreatedEmail({
  to,
  type,
  reportId,
  animalName,
}: SendReportCreatedEmailParams) {
  const typeLabel = getTypeLabel(type);
  const reportUrl = getReportUrl(type, reportId);
  const displayName = animalName?.trim() || "animale";

  const subject =
    type === "lost"
      ? "UNIMALIA Â· Smarrimento pubblicato correttamente"
      : "UNIMALIA Â· Segnalazione pubblicata correttamente";

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #18181b; line-height: 1.6;">
      <h2 style="margin: 0 0 16px;">UNIMALIA</h2>

      <p style="margin: 0 0 16px;">
        Abbiamo registrato correttamente il tuo ${typeLabel}.
      </p>

      <p style="margin: 0 0 16px;">
        <strong>${escapeHtml(displayName)}</strong>
      </p>

      <p style="margin: 0 0 20px;">
        Puoi aprire direttamente lâ€™annuncio da qui:
      </p>

      <p style="margin: 0 0 24px;">
        <a
          href="${reportUrl}"
          style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-weight: 600;"
        >
          Apri annuncio
        </a>
      </p>

      ${
        type === "lost"
          ? `
            <div style="margin: 24px 0; padding: 16px; border: 1px solid #e4e4e7; border-radius: 16px; background: #fafafa;">
              <p style="margin: 0 0 10px; font-weight: 600;">
                Consiglio utile
              </p>
              <p style="margin: 0;">
                Se ${escapeHtml(
                  displayName
                )} verrÃ  ritrovato, potrai aggiornare lo stato dellâ€™annuncio. In seguito potremo anche invitarti a creare la scheda animale su UNIMALIA, cosÃ¬ avrai tutto piÃ¹ pronto in caso di emergenza.
              </p>
            </div>
          `
          : ""
      }

      <p style="margin: 24px 0 0; color: #52525b; font-size: 14px;">
        Questa Ã¨ una email automatica di servizio inviata da UNIMALIA.
      </p>
    </div>
  `;

  const text = [
    "UNIMALIA",
    "",
    `Abbiamo registrato correttamente il tuo ${typeLabel}.`,
    `Animale: ${displayName}`,
    "",
    `Apri annuncio: ${reportUrl}`,
    "",
    type === "lost"
      ? `Se ${displayName} verrÃ  ritrovato, potrai aggiornare lo stato dellâ€™annuncio. In seguito potremo anche invitarti a creare la scheda animale su UNIMALIA.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return resend.emails.send({
    from: EMAIL_FROM_NO_REPLY,
    to,
    subject,
    html,
    text,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
