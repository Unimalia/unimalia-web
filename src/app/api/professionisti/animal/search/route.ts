import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

type AnimalRow = {
  id: string;
  name: string | null;
  species: string | null;
  chip_number: string | null;
  owner_id: string | null;
  pending_owner_email: string | null;
  owner_claim_status: "none" | "pending" | "claimed" | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

function normalizeEmail(value?: string | null) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function normalizePhone(value?: string | null) {
  let digits = String(value ?? "").replace(/\D+/g, "");

  if (!digits) return null;

  // rimuove prefisso internazionale italiano
  if (digits.startsWith("39") && digits.length > 10) {
    digits = digits.slice(2);
  }

  return digits;
}

function normalizeChip(value?: string | null) {
  const digits = String(value ?? "").replace(/\D+/g, "");
  return digits.length ? digits : null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Body non valido" }, { status: 400 });
    }

    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const chip = normalizeChip(body.microchip);

    if (!email && !phone && !chip) {
      return NextResponse.json(
        { error: "Inserisci almeno email, telefono o microchip" },
        { status: 400 }
      );
    }

    // =====================================================
    // 1. MICROCHIP MATCH (PRIORITARIO)
    // =====================================================

    if (chip && chip.length === 15) {
      const { data, error } = await admin
        .from("animals")
        .select("id, name, species, chip_number, owner_id, pending_owner_email, owner_claim_status")
        .eq("chip_number", chip)
        .limit(1)
        .returns<AnimalRow[]>();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const animal = data?.[0];

      if (animal) {
        return NextResponse.json({
          found: true,
          strong_match: true,
          animal: {
            id: animal.id,
            name: animal.name,
            species: animal.species,
            microchip: animal.chip_number,
            owner_claim_status: animal.owner_claim_status,
          },
        });
      }
    }

    // =====================================================
    // 2. MATCH EMAIL + TELEFONO
    // =====================================================

    let profileIds: string[] = [];

    if (email) {
      const { data: profilesByEmail } = await admin
        .from("profiles")
        .select("id")
        .ilike("email", email);

      if (profilesByEmail) {
        profileIds.push(...profilesByEmail.map((p) => p.id));
      }
    }

    if (phone) {
      const { data: profilesByPhone } = await admin
        .from("profiles")
        .select("id, phone")
        .returns<ProfileRow[]>();

      const filtered =
        profilesByPhone?.filter((p) => {
          const normalized = normalizePhone(p.phone);
          return normalized && normalized === phone;
        }) || [];

      profileIds.push(...filtered.map((p) => p.id));
    }

    profileIds = Array.from(new Set(profileIds));

    let animals: AnimalRow[] = [];

    if (profileIds.length > 0) {
      const { data, error } = await admin
        .from("animals")
        .select("id, name, species, chip_number, owner_id, pending_owner_email, owner_claim_status")
        .in("owner_id", profileIds)
        .returns<AnimalRow[]>();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      animals = data || [];
    }

    // =====================================================
    // 3. MATCH SU EMAIL PENDING (owner non registrato)
    // =====================================================

    if (email) {
      const { data } = await admin
        .from("animals")
        .select("id, name, species, chip_number, owner_id, pending_owner_email, owner_claim_status")
        .ilike("pending_owner_email", email)
        .returns<AnimalRow[]>();

      if (data) {
        animals.push(...data);
      }
    }

    // dedup
    const unique = new Map<string, AnimalRow>();
    for (const a of animals) {
      unique.set(a.id, a);
    }

    const result = Array.from(unique.values());

    if (result.length === 0) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      candidates: result.map((a) => ({
        id: a.id,
        name: a.name,
        species: a.species,
        microchip: a.chip_number,
        owner_claim_status: a.owner_claim_status,
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    );
  }
}