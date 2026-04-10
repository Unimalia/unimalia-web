import { NextResponse } from "next/server";
import { createCodeChallenge, createCodeVerifier } from "@/lib/vetinfo/pkce";
import { createOAuthState, saveOAuthSession } from "@/lib/vetinfo/state";
import { vetinfoConfig } from "@/lib/vetinfo/config";
import { getCurrentUserFromBearerOrThrow } from "@/lib/server/auth";

export async function GET(req: Request) {
  const user = await getCurrentUserFromBearerOrThrow(req);

  const state = createOAuthState();
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);

  await saveOAuthSession({
    state,
    userId: user.id,
    codeVerifier,
    redirectUri: vetinfoConfig.redirectUri,
  });

  const url = new URL(`${vetinfoConfig.oauthServer}/oauth/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", vetinfoConfig.clientId);
  url.searchParams.set("scope", vetinfoConfig.scope);
  url.searchParams.set("redirect_uri", vetinfoConfig.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return NextResponse.json({
    ok: true,
    authorizeUrl: url.toString(),
  });
}