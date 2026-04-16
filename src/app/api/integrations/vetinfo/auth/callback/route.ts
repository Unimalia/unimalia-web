import { NextRequest, NextResponse } from 'next/server'
import { consumeOAuthSession } from '@/lib/vetinfo/state'
import { exchangeAuthorizationCode } from '@/lib/vetinfo/oauth'
import { saveVetinfoTokenSet } from '@/lib/vetinfo/token-store'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/impostazioni?vetinfo=oauth_error', req.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/impostazioni?vetinfo=missing_code', req.url))
  }

  const session = await consumeOAuthSession(state)
  if (!session) {
    return NextResponse.redirect(new URL('/impostazioni?vetinfo=invalid_state', req.url))
  }

  const tokenSet = await exchangeAuthorizationCode({
    code,
    codeVerifier: session.code_verifier,
    redirectUri: session.redirect_uri,
  })

  await saveVetinfoTokenSet({
    userId: session.user_id,
    tokenSet,
  })

  return NextResponse.redirect(new URL('/impostazioni?vetinfo=connected', req.url))
}
