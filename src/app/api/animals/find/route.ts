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
  unimalia_code?: string | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Vecchi parametri
  const rawChip = (url.searchParams.get("chip") || "").trim();
  const rawId = (url.searchParams.get("id") || "").trim();

  // Nuovi parametri “universali”
  const rawQ = (url.searchParams.get("q") || "").trim();
  const rawCode = (url.searchParams.get("code") || "").trim();

  const supabase = await createServerSupabaseClient();
  await supabase.auth.getUser().catch(() => null);

  // 1) Comportamento legacy identico
  if (rawId) {
    if (!isUuid(rawId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { data: animal, error } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status, unimalia_code")
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
        unimalia_code: animal.unimalia_code ?? null,
      },
    });
  }

  if (rawChip) {
    const { data: animal, error } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status, unimalia_code")
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
        unimalia_code: animal.unimalia_code ?? null,
      },
    });
  }

  // 2) Modalità universale
  const primary = (rawQ || rawCode).trim();
  if (!primary) {
    return NextResponse.json({ error: "Missing chip or id or q/code" }, { status: 400 });
  }

  // Normalizza "UNIMALIA:xxxx" o "UNIMALIA-xxxx"
  let token = primary.trim();
  if (token.toUpperCase().startsWith("UNIMALIA:")) token = token.slice("UNIMALIA:".length).trim();
  if (token.toUpperCase().startsWith("UNIMALIA-")) token = token.slice("UNIMALIA-".length).trim();

  // 2A) Prima prova la cosa GIUSTA per te: animals.unimalia_code
  // (token è l'uuid senza prefisso)
  if (token) {
    const { data: animalByCode, error: codeErr } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status, unimalia_code")
      .eq("unimalia_code", token)
      .limit(1)
      .maybeSingle<AnimalRow>();

    if (codeErr) return NextResponse.json({ error: codeErr.message }, { status: 500 });

    if (animalByCode) {
      return NextResponse.json({
        found: true,
        animal: {
          id: animalByCode.id,
          name: animalByCode.name ?? "",
          species: animalByCode.species ?? null,
          chip_number: animalByCode.chip_number ?? null,
          owner_id: animalByCode.owner_id,
          status: animalByCode.status ?? null,
          unimalia_code: animalByCode.unimalia_code ?? null,
        },
      });
    }
  }

  // 2B) Se sembra microchip, prova chip_number
  if (looksLikeChip(token)) {
    const asChip = digitsOnly(token);
    const { data: animalByChip, error: chipErr } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status, unimalia_code")
      .eq("chip_number", asChip)
      .limit(1)
      .maybeSingle<AnimalRow>();

    if (chipErr) return NextResponse.json({ error: chipErr.message }, { status: 500 });

    if (animalByChip) {
      return NextResponse.json({
        found: true,
        animal: {
          id: animalByChip.id,
          name: animalByChip.name ?? "",
          species: animalByChip.species ?? null,
          chip_number: animalByChip.chip_number ?? null,
          owner_id: animalByChip.owner_id,
          status: animalByChip.status ?? null,
          unimalia_code: animalByChip.unimalia_code ?? null,
        },
      });
    }
  }

  // 2C) Se è UUID, prova anche animals.id (solo come fallback)
  if (isUuid(token)) {
    const { data: animalById, error: idErr } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status, unimalia_code")
      .eq("id", token)
      .limit(1)
      .maybeSingle<AnimalRow>();

    if (idErr) return NextResponse.json({ error: idErr.message }, { status: 500 });

    if (animalById) {
      return NextResponse.json({
        found: true,
        animal: {
          id: animalById.id,
          name: animalById.name ?? "",
          species: animalById.species ?? null,
          chip_number: animalById.chip_number ?? null,
          owner_id: animalById.owner_id,
          status: animalById.status ?? null,
          unimalia_code: animalById.unimalia_code ?? null,
        },
      });
    }
  }

  return NextResponse.json({ found: false }, { status: 200 });
}