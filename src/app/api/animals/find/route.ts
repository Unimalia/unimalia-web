// src/app/api/animals/find/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawChip = url.searchParams.get("chip") || "";
    const chip = digitsOnly(rawChip);

    if (!chip || chip.length < 10 || chip.length > 20) {
      return NextResponse.json({ error: "Invalid chip" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // 1) match esatto (DB pulito)
    const exact = await admin
      .from("animals")
      .select("id, chip_number")
      .eq("chip_number", chip)
      .maybeSingle();

    if (exact.data?.id) {
      return NextResponse.json({ animalId: exact.data.id }, { status: 200 });
    }

    // 2) fallback: DB sporco (chip con spazi/prefissi) → ilike
    const fuzzy = await admin
      .from("animals")
      .select("id, chip_number")
      .ilike("chip_number", `%${chip}%`)
      .limit(1)
      .maybeSingle();

    if (fuzzy.data?.id) {
      return NextResponse.json({ animalId: fuzzy.data.id }, { status: 200 });
    }

    return NextResponse.json({ animalId: null }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}