import { vetinfoConfig } from "@/lib/vetinfo/config"

export type VetinfoTokenSet = {
  accessToken: string
  refreshToken: string | null
  tokenType: string
  expiresIn: number
  scope: string | null
}

function getBasicAuthHeader() {
  const raw = `${vetinfoConfig.clientId}:${vetinfoConfig.clientSecret}`
  const encoded = Buffer.from(raw).toString("base64")
  return `Basic ${encoded}`
}

export async function exchangeAuthorizationCode(input: {
  code: string
  codeVerifier: string
  redirectUri: string
}): Promise<VetinfoTokenSet> {
  const url = new URL(`${vetinfoConfig.oauthServer}/oauth/token`)
  url.searchParams.set("grant_type", "authorization_code")
  url.searchParams.set("scope", vetinfoConfig.scope)
  url.searchParams.set("code", input.code)
  url.searchParams.set("redirect_uri", input.redirectUri)
  url.searchParams.set("code_verifier", input.codeVerifier)

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: getBasicAuthHeader(),
    },
    cache: "no-store",
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.access_token) {
    throw new Error(
      `VETINFO_TOKEN_EXCHANGE_FAILED: ${res.status} ${JSON.stringify(json)}`
    )
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    tokenType: json.token_type ?? "bearer",
    expiresIn: Number(json.expires_in ?? 0),
    scope: json.scope ?? null,
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<VetinfoTokenSet> {
  const url = new URL(`${vetinfoConfig.oauthServer}/oauth/token`)
  url.searchParams.set("grant_type", "refresh_token")
  url.searchParams.set("refresh_token", refreshToken)

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: getBasicAuthHeader(),
    },
    cache: "no-store",
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.access_token) {
    throw new Error(
      `VETINFO_TOKEN_REFRESH_FAILED: ${res.status} ${JSON.stringify(json)}`
    )
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    tokenType: json.token_type ?? "bearer",
    expiresIn: Number(json.expires_in ?? 0),
    scope: json.scope ?? null,
  }
}