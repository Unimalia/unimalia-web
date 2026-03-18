import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

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
      raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    return new URL(withProto);
  } catch {
    return null;
  }
}

function rankAnimal(row: any) {
  let score = 0;

  if (row?.owner_id) score += 100;
  if (row?.owner_claim_status === "claimed") score += 50;
  if (row?.owner_claim_status === "pending") score += 10;
  if (row?.created_by_role === "owner") score += 20;

  const createdAt = row?.created_at ? new Date(row.created_at).getTime() : 0;
  score += Math.floor(createdAt / 1000000000);

  return score;
}

function pickBestAnimal(rows: any[]) {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => rankAnimal(b) - rankAnimal(a))[0];
}

async function findById(id: string) {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("animals")
    .select("id, name, species, chip_number, owner_id, owner_claim_status, created_by_role, created_at, unimalia_code")
    .eq("id", id)
    .limit(1);

  if (error) throw error;
  return pickBestAnimal(data ?? []);
}

async function findByChip(chip: string) {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("animals")
    .select("id, name, species, chip_number, owner_id, owner_claim_status, created_by_role, created_at, unimalia_code")
    .eq("chip_number", chip)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return pickBestAnimal(data ?? []);
}

async function findByUnimaliaCode(code: string) {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("animals")
    .select("id, name, species, chip_number, owner_id, owner_claim_status, created_by_role, created_at, unimalia_code")
    .eq("unimalia_code", code)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return pickBestAnimal(data ?? []);
}

export async function GET(req: Request) {
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

  const notFound = () => NextResponse.json({ found: false }, { status: 200 });

  try {
    if (id) {
      if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

      const animal = await findById(id);
      if (!animal) return notFound();

      return NextResponse.json({ found: true, animal }, { status: 200 });
    }

    if (chip) {
      const animal = await findByChip(chip);
      if (!animal) return notFound();

      return NextResponse.json({ found: true, animal }, { status: 200 });
    }

    if (!q) {
      return NextResponse.json({ error: "Missing chip, id or q" }, { status: 400 });
    }

    const dq = digitsOnly(q);
    if (dq.length === 15 || dq.length === 10) {
      const animal = await findByChip(dq);
      if (!animal) return notFound();

      return NextResponse.json({ found: true, animal }, { status: 200 });
    }

    if (isUuid(q)) {
      const byId = await findById(q);
      if (byId) return NextResponse.json({ found: true, animal: byId }, { status: 200 });

      const byCode = await findByUnimaliaCode(q);
      if (!byCode) return notFound();

      return NextResponse.json({ found: true, animal: byCode }, { status: 200 });
    }

    return notFound();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}