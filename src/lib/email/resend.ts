import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export function getBaseUrl() {
  return process.env.PUBLIC_BASE_URL || "http://localhost:3000";
}