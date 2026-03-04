import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * Mittenti standard (centralizzati).
 * - EMAIL_FROM_NO_REPLY: per conferme, notifiche, automazioni
 * - EMAIL_FROM_MESSAGES: per messaggi/contatti/report (se vuoi separarlo)
 */
export const EMAIL_FROM_NO_REPLY =
  process.env.EMAIL_FROM_NO_REPLY || "UNIMALIA <no-reply@unimalia.it>";

export const EMAIL_FROM_MESSAGES =
  process.env.EMAIL_FROM_MESSAGES || EMAIL_FROM_NO_REPLY;

export function getBaseUrl() {
  return process.env.PUBLIC_BASE_URL || "http://localhost:3000";
}