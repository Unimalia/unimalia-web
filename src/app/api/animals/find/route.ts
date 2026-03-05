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

  // supporta unimalia://xxx
  v = v.replace(/^unimalia:\/\//i, "");

  // supporta prefisso UNIMALIA: oppure UNIMALIA-
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

export async function GET(req: Request) {
  const url = new URL(req.url);

  // legacy
  const rawChip = url.searchParams.get("chip") || "";
  const rawId = url.searchParams.get("id") || "";

  // universal
  const rawQ = url.searchParams.get("q") || "";

  // se arriva un URL in q, estrai q=...
  let q = rawQ.trim();
  const maybeUrl = q ? tryParseUrl(q) : null;
  if (maybeUrl) {
    const qp = maybeUrl.searchParams.get("q");
    if (qp) q = qp;
  }

  // normalizza q
  q = normalizeInput(q);

  // priorità:
  // 1) id esplicito
  // 2) chip esplicito
  // 3) q (può essere chip / id / unimalia_code / url)
  const id = (rawId || "").trim();
  const chip = digitsOnly(rawChip);

  const admin = supabaseAdmin();

  // helper: risposta standard
  const notFound = () => NextResponse.json({ found: false }, { status: 200 });

  try {
    // 1) lookup per id (animals.id)
    if (id) {
      if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

      const { data: animal, error } = await admin
        .from("animals")
        .select("id, name, species, chip_number, owner_id, status, unimalia_code")
        .eq("id", id)
        .maybeSingle();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!animal) return notFound();

      return NextResponse.json({ found: true, animal }, { status: 200 });
    }

    // 2) lookup per chip_number
    if (chip) {
      const { data: animal, error } = await admin
        .from("animals")
        .select("id, name, species, chip_number, owner_id, status, unimalia_code")
        .eq("chip_number", chip)
        .maybeSingle();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!animal) return notFound();

      return NextResponse.json({ found: true, animal }, { status: 200 });
    }

    // 3) lookup universale q
    if (!q) {
      return NextResponse.json({ error: "Missing chip, id or q" }, { status: 400 });
    }

    // se q è 15/10 cifre -> chip
    const dq = digitsOnly(q);
    if (dq.length === 15 || dq.length === 10) {
      const { data: animal, error } = await admin
        .from("animals")
        .select("id, name, species, chip_number, owner_id, status, unimalia_code")
        .eq("chip_number", dq)
        .maybeSingle();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!animal) return notFound();

      return NextResponse.json({ found: true, animal }, { status: 200 });
    }

    // se q è uuid: può essere animals.id oppure unimalia_code
    if (isUuid(q)) {
      // prima prova animals.id
      {
        const { data: animal, error } = await admin
          .from("animals")
          .select("id, name, species, chip_number, owner_id, status, unimalia_code")
          .eq("id", q)
          .maybeSingle();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (animal) return NextResponse.json({ found: true, animal }, { status: 200 });
      }

      // poi prova unimalia_code
      {
        const { data: animal, error } = await admin
          .from("animals")
          .select("id, name, species, chip_number, owner_id, status, unimalia_code")
          .eq("unimalia_code", q)
          .maybeSingle();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (!animal) return notFound();

        return NextResponse.json({ found: true, animal }, { status: 200 });
      }
    }

    // fallback: se q non è uuid e non è chip -> niente
    return notFound();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}