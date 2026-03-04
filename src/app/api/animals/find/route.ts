import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawChip = url.searchParams.get("chip");
  const rawId = url.searchParams.get("id");

  const chip = (rawChip || "").trim();
  const id = (rawId || "").trim();

  if (!chip && !id) {
    return NextResponse.json({ error: "Missing chip or id" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // opzionale: serve solo per contesto (non blocchiamo se non loggato)
  await supabase.auth.getUser().catch(() => null);

  let q = supabase
    .from("animals")
    .select("id, name, species, chip_number, owner_id, status")
    .limit(1);

  if (id) {
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    q = q.eq("id", id);
  } else {
    // chip_number nel tuo db (non microchip)
    q = q.eq("chip_number", chip);
  }

  const { data: animal, error } = await q.maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!animal) return NextResponse.json({ found: false }, { status: 200 });

  // NB: qui NON diciamo "hasAccess" perché l'accesso lo decide grants/check.
  return NextResponse.json({
    found: true,
    animal: {
      id: animal.id,
      name: animal.name ?? "",
      species: animal.species ?? null,
      chip_number: animal.chip_number ?? null,
      owner_id: animal.owner_id,
      status: animal.status ?? null,
    },
  });
}