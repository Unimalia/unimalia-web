import crypto from "crypto";

const TOKEN_BYTES = 24;

function getPepper(): string {
  const pepper = process.env.EMERGENCY_QR_TOKEN_PEPPER;
  if (!pepper) {
    throw new Error("Missing EMERGENCY_QR_TOKEN_PEPPER");
  }
  return pepper;
}

export function generateEmergencyToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function normalizeEmergencyToken(token: string): string {
  return token.trim();
}

export function getEmergencyTokenPrefix(token: string): string {
  return token.slice(0, 8);
}

export function hashEmergencyToken(token: string): string {
  const normalized = normalizeEmergencyToken(token);
  const pepper = getPepper();

  return crypto
    .createHash("sha256")
    .update(`${normalized}:${pepper}`, "utf8")
    .digest("hex");
}

export function hashValue(value: string): string {
  const pepper = getPepper();

  return crypto
    .createHash("sha256")
    .update(`${value}:${pepper}`, "utf8")
    .digest("hex");
}

export function isEmergencyTokenFormatValid(token: string): boolean {
  const normalized = normalizeEmergencyToken(token);

  if (!normalized) return false;
  if (normalized.length < 20) return false;
  if (normalized.length > 128) return false;

  return /^[A-Za-z0-9\-_]+$/.test(normalized);
}