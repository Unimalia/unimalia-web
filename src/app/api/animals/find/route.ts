<<<<<<< HEAD
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chip = (searchParams.get("chip") ?? "").trim();

  // microchip tipico 15 cifre; accetto 10-20 per tolleranza (se vuoi stringente lo rendiamo 15)
  if (!chip || !/^\d{10,20}$/.test(chip)) {
    return NextResponse.json({ error: "Invalid chip" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("animals")
    .select("id")
    .eq("chip_number", chip)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ animalId: data.id });
=======
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
>>>>>>> feat/pubblica-professionisti
}