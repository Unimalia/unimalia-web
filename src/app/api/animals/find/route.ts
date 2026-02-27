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
}