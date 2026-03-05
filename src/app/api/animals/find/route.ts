import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

function looksLikeChip(v: string) {
  const d = digitsOnly(v);
  return d.length >= 10;
}

type AnimalRow = {
  id: string;
  name: string | null;
  species: string | null;
  chip_number: string | null;
  owner_id: string;
  status: string | null;
};

type AnimalPublicRow = {
  animal_id: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Compatibilità vecchia
  const rawChip = (url.searchParams.get("chip") || "").trim();
  const rawId = (url.searchParams.get("id") || "").trim();

  // Modalità universale
  const rawQ = (url.searchParams.get("q") || "").trim();
  const rawCode = (url.searchParams.get("code") || "").trim();

  const supabase = await createServerSupabaseClient();

  // opzionale: contesto auth (non blocca)
  await supabase.auth.getUser().catch(() => null);

  // Se usano i parametri vecchi, comportamento identico a prima
  if (rawId) {
    if (!isUuid(rawId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { data: animal, error } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status")
      .eq("id", rawId)
      .limit(1)
      .maybeSingle<AnimalRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!animal) return NextResponse.json({ found: false }, { status: 200 });

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

  if (rawChip) {
    const { data: animal, error } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status")
      .eq("chip_number", rawChip)
      .limit(1)
      .maybeSingle<AnimalRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!animal) return NextResponse.json({ found: false }, { status: 200 });

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

  // Modalità universale: q o code
  const primary = (rawQ || rawCode).trim();
  if (!primary) {
    return NextResponse.json({ error: "Missing chip or id or q/code" }, { status: 400 });
  }

  // Normalizza prefisso UNIMALIA:
  let token = primary;
  if (token.toUpperCase().startsWith("UNIMALIA:")) token = token.slice("UNIMALIA:".length).trim();
  if (token.toUpperCase().startsWith("UNIMALIA-")) token = token.slice("UNIMALIA-".length).trim();

  // Se sembra microchip, prova come chip_number
  if (looksLikeChip(token)) {
    const asChip = digitsOnly(token);

    const { data: animal, error } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status")
      .eq("chip_number", asChip)
      .limit(1)
      .maybeSingle<AnimalRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (animal) {
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
  }

  // Se è un UUID, NON assumiamo che sia animals.id:
  // 1) prova animals.id
  if (isUuid(token)) {
    const { data: animal, error } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status")
      .eq("id", token)
      .limit(1)
      .maybeSingle<AnimalRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (animal) {
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
  }

  // 2) prova token UNIMALIA via RPC get_animal_public (questa è la fonte vera)
  // Nota: la RPC aspetta p_token = token (senza prefisso UNIMALIA:)
  const { data: rpcData, error: rpcErr } = await supabase.rpc("get_animal_public", { p_token: token });

  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 });

  const first = (rpcData?.[0] as AnimalPublicRow) ?? null;
  const resolvedAnimalId = first?.animal_id ? String(first.animal_id) : "";

  if (!resolvedAnimalId) {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  const { data: animal, error: aErr } = await supabase
    .from("animals")
    .select("id, name, species, chip_number, owner_id, status")
    .eq("id", resolvedAnimalId)
    .limit(1)
    .maybeSingle<AnimalRow>();

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
  if (!animal) return NextResponse.json({ found: false }, { status: 200 });

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