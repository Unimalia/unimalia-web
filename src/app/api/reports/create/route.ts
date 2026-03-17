import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function hashIp(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function POST(req: Request) {
  try {
    const admin = supabaseAdmin();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ip_hash = hashIp(ip);

    const body = await req.json().catch(() => ({}));

    const title = String(body?.title || "").trim();
    const contact_email = String(body?.contact_email || "").trim();
    const contact_phone =
      body?.contact_phone == null ? null : String(body.contact_phone).trim() || null;

    const type =
      body?.type === "lost" || body?.type === "found" || body?.type === "sighted"
        ? body.type
        : null;

    const animal_name =
      body?.animal_name == null ? null : String(body.animal_name).trim() || null;

    const species = String(body?.species || "").trim() || null;
    const region = String(body?.region || "").trim() || null;
    const province = String(body?.province || "").trim() || null;
    const location_text = String(body?.location_text || "").trim() || null;
    const event_date = String(body?.event_date || "").trim() || null;
    const description = String(body?.description || "").trim() || null;

    const contact_mode =
      body?.contact_mode === "protected" || body?.contact_mode === "phone_public"
        ? body.contact_mode
        : "protected";

    const consent = body?.consent === true;

    const lat =
      typeof body?.lat === "number" && Number.isFinite(body.lat) ? body.lat : null;

    const lng =
      typeof body?.lng === "number" && Number.isFinite(body.lng) ? body.lng : null;

    const photo_urls = Array.isArray(body?.photo_urls) ? body.photo_urls : [];

    if (!title || !contact_email || !type) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    if (!consent) {
      return NextResponse.json(
        { error: "Devi accettare l’informativa per pubblicare." },
        { status: 400 }
      );
    }

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const { count, error: countErr } = await admin
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ip_hash)
      .gte("created_at", since);

    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 400 });
    }

    const limit = Number(body?.rate_limit ?? 10);

    if ((count || 0) >= limit) {
      return NextResponse.json(
        { error: "Limite creazione annunci raggiunto. Riprova più tardi." },
        { status: 429 }
      );
    }

    const insertRow: Record<string, unknown> = {
      title,
      contact_email,
      contact_phone,
      type,
      animal_name,
      species,
      region,
      province,
      location_text,
      event_date,
      description,
      contact_mode,
      consent,
      lat,
      lng,
      photo_urls,
      ip_hash,
    };

    if (body?.verify_token) insertRow.verify_token = body.verify_token;
    if (typeof body?.email_verified === "boolean") {
      insertRow.email_verified = body.email_verified;
    }

    const { data, error } = await admin
      .from("reports")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, report: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore server" }, { status: 500 });
  }
}