import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  supabaseAdmin,
} from "@/lib/supabase/server";
import { isUuid } from "@/lib/server/validators";

export const dynamic = "force-dynamic";

type ProfessionalProfileRow = {
  user_id: string;
  org_id: string | null;
};

type ProfessionalRow = {
  id: string;
  owner_id: string;
};

type AnimalRow = {
  id: string;
  name: string | null;
  species: string | null;
  chip_number: string | null;
  owner_id?: string | null;
  owner_claim_status?: string | null;
  created_by_role?: string | null;
  created_at?: string | null;
  unimalia_code?: string | null;
};

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

function normalizeInput(raw: string) {
  let v = (raw || "").trim();
  if (!v) return "";

  v = v.replace(/^unimalia:\/\//i, "");
  v = v.replace(/^unimalia[:\-]\s*/i, "");

  return v.trim();
}

function tryParseUrl(raw: string) {
  try {
    const withProto =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? raw
        : `https://${raw}`;
    return new URL(withProto);
  } catch {
    return null;
  }
}

function rankAnimal(row: AnimalRow) {
  let score = 0;

  if (row?.owner_id) score += 100;
  if (row?.owner_claim_status === "claimed") score += 50;
  if (row?.owner_claim_status === "pending") score += 10;
  if (row?.created_by_role === "owner") score += 20;

  const createdAt = row?.created_at ? new Date(row.created_at).getTime() : 0;
  score += Math.floor(createdAt / 1000000000);

  return score;
}

function pickBestAnimal(rows: AnimalRow[]) {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => rankAnimal(b) - rankAnimal(a))[0];
}

function toProfessionalAnimal(row: AnimalRow) {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    chip_number: row.chip_number ?? null,
    microchip: row.chip_number ?? null,
    owner_id: row.owner_id ?? null,
    owner_claim_status: row.owner_claim_status ?? null,
    unimalia_code: row.unimalia_code ?? null,
    created_by_role: row.created_by_role ?? null,
  };
}

function notFound() {
  return NextResponse.json({ found: false }, { status: 200 });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function ensureProfessionalContext(userId: string) {
  const admin = supabaseAdmin();

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", userId)
    .maybeSingle<ProfessionalProfileRow>();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const professionalResult = await admin
    .from("professionals")
    .select("id, owner_id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ProfessionalRow>();

  if (professionalResult.error) {
    throw professionalResult.error;
  }

  return Boolean(profileResult.data?.org_id || professionalResult.data?.id);
}

async function findById(id: string) {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("animals")
    .select(
      "id, name, species, chip_number, owner_id, owner_claim_status, created_by_role, created_at, unimalia_code"
    )
    .eq("id", id)
    .limit(1);

  if (error) throw error;
  return pickBestAnimal((data ?? []) as AnimalRow[]);
}

async function findByChip(chip: string) {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("animals")
    .select(
      "id, name, species, chip_number, owner_id, owner_claim_status, created_by_role, created_at, unimalia_code"
    )
    .eq("chip_number", chip)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return pickBestAnimal((data ?? []) as AnimalRow[]);
}

async function findByUnimaliaCode(code: string) {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("animals")
    .select(
      "id, name, species, chip_number, owner_id, owner_claim_status, created_by_role, created_at, unimalia_code"
    )
    .eq("unimalia_code", code)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return pickBestAnimal((data ?? []) as AnimalRow[]);
}

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return unauthorized();
  }

  try {
    const hasProfessionalContext = await ensureProfessionalContext(user.id);

    if (!hasProfessionalContext) {
      return NextResponse.json(
        { error: "Professional context not found" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);

    const rawChip = url.searchParams.get("chip") || "";
    const rawId = url.searchParams.get("id") || "";
    const rawQ = url.searchParams.get("q") || "";

    let q = rawQ.trim();
    const maybeUrl = q ? tryParseUrl(q) : null;
    if (maybeUrl) {
      const qp = maybeUrl.searchParams.get("q");
      if (qp) q = qp;
    }

    q = normalizeInput(q);

    const id = (rawId || "").trim();
    const chip = digitsOnly(rawChip);

    if (id) {
      if (!isUuid(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }

      const animal = await findById(id);
      if (!animal) return notFound();

      return NextResponse.json(
        { found: true, animal: toProfessionalAnimal(animal) },
        { status: 200 }
      );
    }

    if (chip) {
      const animal = await findByChip(chip);
      if (!animal) return notFound();

      return NextResponse.json(
        { found: true, animal: toProfessionalAnimal(animal) },
        { status: 200 }
      );
    }

    if (!q) {
      return NextResponse.json(
        { error: "Missing chip, id or q" },
        { status: 400 }
      );
    }

    const dq = digitsOnly(q);
    if (dq.length === 15 || dq.length === 10) {
      const animal = await findByChip(dq);
      if (!animal) return notFound();

      return NextResponse.json(
        { found: true, animal: toProfessionalAnimal(animal) },
        { status: 200 }
      );
    }

    if (isUuid(q)) {
      const byId = await findById(q);
      if (byId) {
        return NextResponse.json(
          { found: true, animal: toProfessionalAnimal(byId) },
          { status: 200 }
        );
      }

      const byCode = await findByUnimaliaCode(q);
      if (!byCode) return notFound();

      return NextResponse.json(
        { found: true, animal: toProfessionalAnimal(byCode) },
        { status: 200 }
      );
    }

    const byCode = await findByUnimaliaCode(q);
    if (!byCode) return notFound();

    return NextResponse.json(
      { found: true, animal: toProfessionalAnimal(byCode) },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}