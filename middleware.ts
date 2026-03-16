import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function cspValue(value: string) {
  return value.replace(/\s{2,}/g, " ").trim();
}

function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function buildCsp(nonce: string) {
  return cspValue(`
    default-src 'none';
    base-uri 'none';
    object-src 'none';
    frame-ancestors 'none';
    form-action 'self';

    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'
      https://vercel.live
      https://maps.googleapis.com
      https://maps.gstatic.com
      https://cdn.iubenda.com
      https://embeds.iubenda.com
      https://www.googletagmanager.com
      https://www.google-analytics.com
      https://challenges.cloudflare.com;

    script-src-elem 'self' 'nonce-${nonce}' 'strict-dynamic'
      https://vercel.live
      https://maps.googleapis.com
      https://maps.gstatic.com
      https://cdn.iubenda.com
      https://embeds.iubenda.com
      https://www.googletagmanager.com
      https://www.google-analytics.com
      https://challenges.cloudflare.com;

    script-src-attr 'none';

    style-src 'self' 'unsafe-inline' https://cdn.iubenda.com;
    style-src-elem 'self' 'unsafe-inline' https://cdn.iubenda.com;
    style-src-attr 'unsafe-inline';

    img-src 'self' data: https: https://*.googleusercontent.com https://*.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com;
    font-src 'self' data: https:;
    connect-src 'self'
      https://*.supabase.co
      https://maps.googleapis.com
      https://*.googleapis.com
      https://maps.gstatic.com
      https://www.google-analytics.com
      https://region1.google-analytics.com
      https://www.googletagmanager.com
      https://challenges.cloudflare.com;

    frame-src 'self'
      https://www.google.com
      https://google.com
      https://challenges.cloudflare.com;

    manifest-src 'self';
    worker-src 'self' blob:;
    media-src 'self' data: blob: https:;
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/manifest.webmanifest")
  ) {
    return NextResponse.next();
  }

  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};