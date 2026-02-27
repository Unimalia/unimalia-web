// src/app/api/animals/find/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Endpoint "di servizio" per ricerca animale.
// Implementazione minima per ripristinare la build.
// In seguito lo colleghiamo a Supabase come previsto.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Accettiamo parametri tipici (opzionali)
  const microchip = searchParams.get("microchip")?.trim() || null;
  const id = searchParams.get("id")?.trim() || null;
  const uuid = searchParams.get("uuid")?.trim() || null;

  // Per ora: risposta “safe” e deterministica
  return NextResponse.json(
    {
      ok: true,
      found: false,
      query: { microchip, id, uuid },
      message: "Route ripristinata. Implementazione completa in arrivo.",
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  return NextResponse.json(
    {
      ok: true,
      found: false,
      body,
      message: "Route ripristinata. Implementazione completa in arrivo.",
    },
    { status: 200 }
  );
}