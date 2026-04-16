type OAuthSession = {
  state: string
  user_id: string
  code_verifier: string
  redirect_uri: string
  created_at: number
  used_at: number | null
}

const oauthSessions = new Map<string, OAuthSession>()

export function createOAuthState(): string {
  return crypto.randomUUID().replace(/-/g, "")
}

export async function saveOAuthSession(input: {
  state: string
  userId: string
  codeVerifier: string
  redirectUri: string
}) {
  oauthSessions.set(input.state, {
    state: input.state,
    user_id: input.userId,
    code_verifier: input.codeVerifier,
    redirect_uri: input.redirectUri,
    created_at: Date.now(),
    used_at: null,
  })
}

export async function consumeOAuthSession(state: string) {
  const session = oauthSessions.get(state)

  if (!session) return null
  if (session.used_at) return null

  session.used_at = Date.now()
  oauthSessions.set(state, session)

  return session
}
