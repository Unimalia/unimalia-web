import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export const dynamic = "force-dynamic";

function digitsOnly(v: string) {
  return String(v || "").replace(/\D+/g, "");
}

function cleanText(v: unknown) {
  return String(v ?? "").trim();
}

function normalizeSpecies(v: string) {
  const value = cleanText(v).toLowerCase();
  if (!value) return "";
  if (value === "cane" || value === "dog") return "Cane";
  if (value === "gatto" || value === "cat") return "Gatto";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const orgId = await getProfessionalOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Missing org" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);

    const name = cleanText(body?.name);
    const species = normalizeSpecies(body?.species);
    const breed = cleanText(body?.breed) || null;
    const color = cleanText(body?.color) || null;
    const size = cleanText(body?.size) || null;
    const birthDateRaw = cleanText(body?.birth_date);
    const chipRaw = digitsOnly(body?.chip_number);

    if (name.length < 2) {
      return NextResponse.json({ error: "Nome animale non valido" }, { status: 400 });
    }

    if (species.length < 2) {
      return NextResponse.json({ error: "Specie non valida" }, { status: 400 });
    }

    if (chipRaw && chipRaw.length !== 15) {
      return NextResponse.json(
        { error: "Microchip non valido: servono 15 cifre" },
        { status: 400 }
      );
    }

    if (birthDateRaw && !/^\d{4}-\d{2}-\d{2}$/.test(birthDateRaw)) {
      return NextResponse.json({ error: "Data di nascita non valida" }, { status: 400 });
    }

    if (chipRaw) {
      const { data: existingByChip, error: existingErr } = await admin
        .from("animals")
        .select("id")
        .eq("chip_number", chipRaw)
        .limit(1);

      if (existingErr) {
        return NextResponse.json({ error: existingErr.message }, { status: 500 });
      }

      if (existingByChip && existingByChip.length > 0) {
        return NextResponse.json(
          { error: "Esiste già un animale con questo microchip" },
          { status: 409 }
        );
      }
    }

    const payload = {
      owner_id: null,
      name,
      species,
      breed,
      color,
      size,
      chip_number: chipRaw || null,
      status: "active",
      created_by_role: "professional",
      created_by_org_id: orgId,
      origin_org_id: orgId,
      data_trust_level: "professional",
      owner_claim_status: "pending",
      owner_claimed_at: null,
      microchip_verified: false,
      birth_date: birthDateRaw || null,
      birth_date_is_estimated: false,
    };

    const { data: animal, error: insertErr } = await admin
      .from("animals")
      .insert(payload)
      .select("id,name,species,chip_number,owner_id,owner_claim_status,created_by_role,created_by_org_id")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, animal });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}