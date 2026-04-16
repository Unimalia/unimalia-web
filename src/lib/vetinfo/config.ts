export const vetinfoConfig = {
  oauthServer: process.env.VETINFO_OAUTH_SERVER || "",
  apiBaseUrl: process.env.VETINFO_API_BASE_URL || "",
  clientId: process.env.VETINFO_CLIENT_ID || "",
  clientSecret: process.env.VETINFO_CLIENT_SECRET || "",
  redirectUri: process.env.VETINFO_REDIRECT_URI || "",
  scope: process.env.VETINFO_SCOPE || "FAR",
}

export function isVetinfoConfigured(): boolean {
  return Boolean(
    vetinfoConfig.oauthServer &&
      vetinfoConfig.apiBaseUrl &&
      vetinfoConfig.clientId &&
      vetinfoConfig.clientSecret &&
      vetinfoConfig.redirectUri
  )
}
