import "server-only";
import { resend, EMAIL_FROM_NO_REPLY } from "@/lib/email/resend";

type Params = {
  to: string;
  displayName?: string | null;
  businessName?: string | null;
  category?: string | null;
  isVet?: boolean;
};

type ResendResult = {
  error?: {
    message?: string;
  } | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function categoryLabel(category?: string | null, isVet?: boolean) {
  if (isVet) return "Veterinario";

  switch ((category || "").trim()) {
    case "toelettatura":
      return "Toelettatura";
    case "pensione":
      return "Pensione";
    case "pet_sitter":
      return "Pet sitter / Dog walking";
    case "addestramento":
      return "Addestramento";
    case "pet_detective":
      return "Pet Detective";
    case "ponte_arcobaleno":
      return "Ponte dell’Arcobaleno";
    case "veterinari":
      return "Veterinario";
    case "altro":
      return "Professionista";
    default:
      return "Professionista";
  }
}

export async function sendProfessionalApprovedEmail({
  to,
  displayName,
  businessName,
  category,
  isVet = false,
}: Params) {
  const safeName = escapeHtml((displayName || "Professionista").trim() || "Professionista");
  const safeBusiness = escapeHtml((businessName || "").trim());
  const roleLabel = categoryLabel(category, isVet);

  const subject = "UNIMALIA - Profilo approvato";

  const html = `
<!doctype html>
<html lang="it">
  <body style="margin:0;padding:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e4e4e7;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 16px 32px;text-align:center;background:#ffffff;">
                <img
                  src="https://unimalia.it/logo-main.png"
                  alt="UNIMALIA"
                  width="88"
                  height="80"
                  style="display:block;margin:0 auto 16px auto;height:auto;border:0;"
                />

                <div style="display:inline-block;padding:6px 12px;border:1px solid #99f6e4;background:#f0fdfa;color:#115e59;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">
                  Verificato UNIMALIA
                </div>

                <div style="margin-top:16px;font-size:12px;line-height:18px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;">
                  Portale Professionisti
                </div>

                <h1 style="margin:12px 0 0 0;font-size:28px;line-height:36px;font-weight:700;color:#18181b;">
                  Profilo approvato
                </h1>

                <p style="margin:16px 0 0 0;font-size:16px;line-height:26px;color:#52525b;">
                  Ciao <strong>${safeName}</strong>,
                </p>

                <p style="margin:12px 0 0 0;font-size:16px;line-height:26px;color:#52525b;">
                  il tuo profilo <strong>${escapeHtml(roleLabel)}</strong> su UNIMALIA è stato verificato e approvato.
                </p>

                ${
                  safeBusiness
                    ? `
                <p style="margin:12px 0 0 0;font-size:16px;line-height:26px;color:#52525b;">
                  Struttura / attività: <strong>${safeBusiness}</strong>
                </p>
                `
                    : ""
                }

                <p style="margin:12px 0 0 0;font-size:16px;line-height:26px;color:#52525b;">
                  Da questo momento puoi accedere al Portale Professionisti e utilizzare le funzioni abilitate per il tuo profilo.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 32px 0 32px;text-align:center;">
                <a
                  href="https://unimalia.it/professionisti/login"
                  style="display:inline-block;padding:14px 24px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:14px;font-size:15px;font-weight:700;"
                >
                  Accedi al Portale Professionisti
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px 0 32px;">
                <div style="border:1px solid #e4e4e7;border-radius:16px;background:#fafafa;padding:16px;">
                  <div style="font-size:13px;line-height:20px;font-weight:700;color:#18181b;margin-bottom:8px;">
                    Riepilogo approvazione
                  </div>
                  <div style="font-size:14px;line-height:24px;color:#3f3f46;">
                    <div><strong>Profilo:</strong> ${escapeHtml(roleLabel)}</div>
                    <div><strong>Stato:</strong> Verificato UNIMALIA</div>
                    ${safeBusiness ? `<div><strong>Attività:</strong> ${safeBusiness}</div>` : ""}
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px 0 32px;">
                <p style="margin:0;font-size:14px;line-height:22px;color:#52525b;">
                  Se non hai richiesto tu questa registrazione o ritieni che questa approvazione sia un errore,
                  contattaci rispondendo a questa email.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px 32px 32px;">
                <p style="margin:0;font-size:12px;line-height:20px;color:#71717a;">
                  UNIMALIA<br />
                  Identità animale digitale, accessi clinici controllati, consulti e smarrimenti.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;

  const text = [
    "UNIMALIA - PROFILO APPROVATO",
    "",
    `Ciao ${displayName || "Professionista"},`,
    "",
    `Il tuo profilo ${roleLabel} su UNIMALIA è stato verificato e approvato.`,
    safeBusiness ? `Struttura / attività: ${businessName}` : "",
    "Stato: Verificato UNIMALIA",
    "",
    "Da questo momento puoi accedere al Portale Professionisti e utilizzare le funzioni abilitate per il tuo profilo.",
    "",
    "Accedi qui:",
    "https://unimalia.it/professionisti/login",
  ]
    .filter(Boolean)
    .join("\n");

  const result = (await resend.emails.send({
    from: EMAIL_FROM_NO_REPLY,
    to,
    subject,
    html,
    text,
  })) as ResendResult;

  if (result?.error) {
    throw new Error(result.error.message || "Invio email approvazione fallito");
  }

  return result;
}