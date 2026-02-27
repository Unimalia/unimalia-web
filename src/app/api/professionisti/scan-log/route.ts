// src/app/api/professionisti/scan-log/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint per log scansioni professionisti.
 * Versione minimale per ripristinare build.
 * In seguito: salvataggio su Supabase + auth.
 */
export async function POST(request: Request) {
  let body: any = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(
    {
      ok: true,
      saved: false,
      received: body,
      message: "Route ripristinata (stub). Persistenza su Supabase da implementare.",
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "scan-log alive" }, { status: 200 });
}