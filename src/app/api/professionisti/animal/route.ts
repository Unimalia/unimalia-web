import { NextRequest, NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}

async function resolveAnimalByRef(admin: any, ref: string) {
  const value = (ref || "").trim();

  if (!value) return null;

  // UUID diretto
  if (isUuid(value)) {
    const { data } = await admin
      .from("animals")
      .select("*")
      .eq("id", value)
      .maybeSingle();

    if (data) return data;
  }

  // UNIMALIA:CODE
  if (/^unimalia[:\-]/i.test(value)) {
    const code = value.replace(/^unimalia[:\-]/i, "").trim();

    const { data } = await admin
      .from("animals")
      .select("*")
      .eq("unimalia_code", code)
      .maybeSingle();

    if (data) return data;
  }

  // Microchip
  const chip = digitsOnly(value);

  if (chip.length === 15 || chip.length === 10) {
    const { data } = await admin
      .from("animals")
      .select("*")
      .eq("chip_number", chip)
      .maybeSingle();

    if (data) return data;
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      );
    }

    const isProfessional =
      user.app_metadata?.is_professional === true ||
      user.app_metadata?.is_vet === true;

    if (!isProfessional) {
      return NextResponse.json(
        { error: "Accesso riservato ai professionisti" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);

    const ref =
      url.searchParams.get("animalId") ||
      url.searchParams.get("id") ||
      url.searchParams.get("q");

    if (!ref) {
      return NextResponse.json(
        { error: "Parametro animale mancante" },
        { status: 400 }
      );
    }

    const animal = await resolveAnimalByRef(admin, ref);

    if (!animal) {
      return NextResponse.json(
        { error: "Animale non trovato" },
        { status: 404 }
      );
    }

    // verifica grant
    const { data: grant } = await admin
      .from("animal_access_grants")
      .select("id")
      .eq("animal_id", animal.id)
      .eq("grantee_id", user.id)
      .maybeSingle();

    if (!grant) {
      return NextResponse.json(
        { error: "Accesso non autorizzato" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      animal,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Errore server" },
      { status: 500 }
    );
  }
}