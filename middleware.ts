import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ IMPORTANTISSIMO: non toccare MAI le API route
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // ✅ non toccare assets / next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/manifest.webmanifest")
  ) {
    return NextResponse.next();
  }

  // Se avevi logiche di redirect/auth QUI, re-inseriscile sotto
  // (ma sempre lasciando l'early return per /api sopra)

  return NextResponse.next();
}

// ✅ matcher: evita di matchare /api già qui (doppia protezione)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};