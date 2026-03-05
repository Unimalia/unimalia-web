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
  // Microchip: spesso solo cifre (o con spazi). Se dopo pulizia restano >= 10 cifre, lo trattiamo come chip.
  const d = digitsOnly(v);
  return d.length >= 10;
}

function isMissingColumnOrRelation(errMsg: string) {
  const s = (errMsg || "").toLowerCase();
  return s.includes("does not exist") || s.includes("unknown column") || s.includes("relation") && s.includes("does not exist");
}

async function tryFindByAnimalColumn(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  column: string,
  value: string
) {
  const { data, error } = await supabase
    .from("animals")
    .select("id, name, species, chip_number, owner_id, status")
    .eq(column, value)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingColumnOrRelation(error.message)) return { found: false as const, skip: true as const };
    return { found: false as const, skip: false as const, error: error.message };
  }
  if (!data) return { found: false as const, skip: false as const };
  return { found: true as const, animal: data };
}

async function tryFindByMappingTable(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  table: string,
  tokenColumn: string,
  animalIdColumn: string,
  tokenValue: string
) {
  // 1) risolvi animal_id dalla tabella mapping
  const { data: mapRow, error: mapErr } = await supabase
    .from(table)
    .select(`${animalIdColumn}`)
    .eq(tokenColumn, tokenValue)
    .limit(1)
    .maybeSingle();

  if (mapErr) {
    if (isMissingColumnOrRelation(mapErr.message)) return { found: false as const, skip: true as const };
    return { found: false as const, skip: false as const, error: mapErr.message };
  }
  const resolvedAnimalId = (mapRow as any)?.[animalIdColumn] ? String((mapRow as any)[animalIdColumn]) : "";
  if (!resolvedAnimalId) return { found: false as const, skip: false as const };

  // 2) carica animale
  const { data: animal, error: aErr } = await supabase
    .from("animals")
    .select("id, name, species, chip_number, owner_id, status")
    .eq("id", resolvedAnimalId)
    .limit(1)
    .maybeSingle();

  if (aErr) return { found: false as const, skip: false as const, error: aErr.message };
  if (!animal) return { found: false as const, skip: false as const };
  return { found: true as const, animal };
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Compatibilità: vecchi parametri
  const rawChip = url.searchParams.get("chip");
  const rawId = url.searchParams.get("id");

  // Nuovi parametri "universali"
  const rawCode = url.searchParams.get("code");
  const rawQ = url.searchParams.get("q");

  const chip = (rawChip || "").trim();
  const id = (rawId || "").trim();
  const code = (rawCode || "").trim();
  const q = (rawQ || "").trim();

  const supabase = await createServerSupabaseClient();

  // opzionale: solo contesto (non blocchiamo se non loggato)
  await supabase.auth.getUser().catch(() => null);

  // 0) input: scegliamo un "valore principale" (q/code) se presente, altrimenti id/chip
  const primary = (q || code || id || chip).trim();
  if (!primary) {
    return NextResponse.json({ error: "Missing chip or id or code/q" }, { status: 400 });
  }

  // 1) Se arrivano esplicitamente id/chip, manteniamo la logica originale
  if (id) {
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { data: animal, error } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status")
      .eq("id", id)
      .limit(1)
      .maybeSingle();

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

  if (chip) {
    const { data: animal, error } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status")
      .eq("chip_number", chip)
      .limit(1)
      .maybeSingle();

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

  // 2) Modalità universale: q/code
  // Normalizziamo UNIMALIA:xxxx
  let token = primary;
  if (token.toUpperCase().startsWith("UNIMALIA:")) {
    token = token.slice("UNIMALIA:".length).trim();
  }

  // 2A) Se assomiglia a microchip, prova come chip_number
  if (looksLikeChip(primary) || looksLikeChip(token)) {
    const asChip = digitsOnly(primary) || digitsOnly(token);
    const { data: animal, error } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status")
      .eq("chip_number", asChip)
      .limit(1)
      .maybeSingle();

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
    // se non trovato come chip, continuiamo (magari era un token numerico diverso)
  }

  // 2B) Se è UUID, NON assumiamo che sia animals.id: prima proviamo animals.id, poi le altre strade
  if (isUuid(token)) {
    // prova animals.id
    const { data: animal, error } = await supabase
      .from("animals")
      .select("id, name, species, chip_number, owner_id, status")
      .eq("id", token)
      .limit(1)
      .maybeSingle();

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

  // 2C) Prova colonne "probabili" dentro animals (se esistono)
  // (le colonne mancanti vengono ignorate senza rompere)
  const candidateAnimalColumns = [
    "public_token",
    "public_id",
    "public_code",
    "unimalia_code",
    "unimalia_token",
    "identity_code",
    "identity_id",
    "code",
    "token",
  ];

  for (const col of candidateAnimalColumns) {
    const res = await tryFindByAnimalColumn(supabase, col, primary);
    if (res.found) {
      const a = res.animal;
      return NextResponse.json({
        found: true,
        animal: {
          id: a.id,
          name: a.name ?? "",
          species: a.species ?? null,
          chip_number: a.chip_number ?? null,
          owner_id: a.owner_id,
          status: a.status ?? null,
        },
      });
    }
    if ((res as any).error) return NextResponse.json({ error: (res as any).error }, { status: 500 });
    // se skip o not found: continua
  }

  // 2D) Prova tabelle mapping "probabili" (se esistono)
  // Se non esistono, le saltiamo.
  const mappingCandidates: Array<[string, string, string]> = [
    ["animal_public_tokens", "token", "animal_id"],
    ["animal_public_links", "token", "animal_id"],
    ["animal_codes", "code", "animal_id"],
    ["animal_identities", "public_id", "animal_id"],
    ["identities", "public_id", "animal_id"],
  ];

  for (const [table, tokenCol, animalIdCol] of mappingCandidates) {
    const res = await tryFindByMappingTable(supabase, table, tokenCol, animalIdCol, primary);
    if (res.found) {
      const a = res.animal;
      return NextResponse.json({
        found: true,
        animal: {
          id: a.id,
          name: a.name ?? "",
          species: a.species ?? null,
          chip_number: a.chip_number ?? null,
          owner_id: a.owner_id,
          status: a.status ?? null,
        },
      });
    }
    if ((res as any).error) return NextResponse.json({ error: (res as any).error }, { status: 500 });
  }

  // niente da fare
  return NextResponse.json({ found: false }, { status: 200 });
}