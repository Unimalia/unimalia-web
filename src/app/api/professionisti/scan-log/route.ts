// src/app/api/professionisti/scan-log/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint per log scansioni professionisti.
 * Implementazione minima per ripristinare build.
 * In seguito: inserimento su Supabase (professional_scan_logs) + auth.
 */
export async function POST(request: Request) {
  let body: any = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  // Per ora non persistiamo nulla: rispondiamo OK
  return NextResponse.json(
    {
      ok: true,
      saved: false,
      received: body,
      message: "Route ripristinata. Persistenza su Supabase da implementare.",
    },
    { status: 200 }
  );
}

// opzionale: ping / health
export async function GET() {
  return NextResponse.json({ ok: true, message: "scan-log alive" }, { status: 200 });
}
