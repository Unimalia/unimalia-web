// src/app/api/animals/find/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("chip") ?? "").trim();

  const chip = digitsOnly(raw);

  // microchip tipico 15 cifre; tolleriamo 10-20
  if (!chip || !/^\d{10,20}$/.test(chip)) {
    return NextResponse.json({ error: "Invalid chip" }, { status: 400 });
  }

  // 1) match esatto (DB pulito)
  const exact = await supabaseAdmin
    .from("animals")
    .select("id, chip_number")
    .eq("chip_number", chip)
    .maybeSingle();

  if (exact.error) {
    return NextResponse.json({ error: exact.error.message }, { status: 500 });
  }

  if (exact.data?.id) {
    return NextResponse.json({ animalId: exact.data.id });
  }

  // 2) fallback: se in DB qualcuno ha salvato chip con spazi o prefissi
  //    es: "380 260 123..." oppure "microchip: 380..."
  //    usiamo ILIKE per trovare chip come substring (solo se lunghezza >= 10)
  const pattern = `%${chip}%`;
  const fuzzy = await supabaseAdmin
    .from("animals")
    .select("id, chip_number")
    .ilike("chip_number", pattern)
    .limit(2);

  if (fuzzy.error) {
    return NextResponse.json({ error: fuzzy.error.message }, { status: 500 });
  }

  const rows = fuzzy.data ?? [];
  if (rows.length === 1 && rows[0]?.id) {
    return NextResponse.json({ animalId: rows[0].id, note: "fuzzy_match" });
  }

  // nessun match o match multipli (ambiguo)
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}