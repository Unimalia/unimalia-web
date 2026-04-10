import crypto from "node:crypto"

export function createCodeVerifier(): string {
  return crypto.randomBytes(64).toString("base64url")
}

export function createCodeChallenge(codeVerifier: string): string {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url")
}