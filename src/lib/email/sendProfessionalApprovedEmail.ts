import "server-only";
import { resend, EMAIL_FROM_NO_REPLY } from "@/lib/email/resend";

type Params = {
  to: string;
  displayName?: string | null;
  isVet?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendProfessionalApprovedEmail({
  to,
  displayName,
  isVet = false,
}: Params) {
  const safeName = escapeHtml((displayName || "Professionista").trim() || "Professionista");
  const roleLabel = isVet ? "profilo veterinario" : "profilo professionista";

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
                <div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;">
                  Portale Professionisti
                </div>
                <h1 style="margin:12px 0 0 0;font-size:28px;line-height:36px;font-weight:700;color:#18181b;">
                  Profilo approvato
                </h1>
                <p style="margin:16px 0 0 0;font-size:16px;line-height:26px;color:#52525b;">
                  Ciao <strong>${safeName}</strong>,
                </p>
                <p style="margin:12px 0 0 0;font-size:16px;line-height:26px;color:#52525b;">
                  il tuo ${roleLabel} su UNIMALIA è stato verificato e approvato.
                </p>
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
                  <p style="margin:0;font-size:14px;line-height:22px;color:#3f3f46;">
                    Se non hai richiesto tu questa registrazione o ritieni che questa approvazione sia un errore,
                    contattaci rispondendo a questa email.
                  </p>
                </div>
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
    `Il tuo ${roleLabel} su UNIMALIA è stato verificato e approvato.`,
    "Da questo momento puoi accedere al Portale Professionisti e utilizzare le funzioni abilitate per il tuo profilo.",
    "",
    "Accedi qui:",
    "https://unimalia.it/professionisti/login",
  ].join("\n");

  const result = await resend.emails.send({
    from: EMAIL_FROM_NO_REPLY,
    to,
    subject,
    html,
    text,
  });

  if ((result as any)?.error) {
    throw new Error((result as any).error.message || "Invio email approvazione fallito");
  }

  return result;
}