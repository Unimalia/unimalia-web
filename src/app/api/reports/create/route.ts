import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendReportCreatedEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

function hashIp(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

async function verifyTurnstileToken(token: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { ok: false, error: "TURNSTILE_SECRET_KEY mancante." };
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip && ip !== "unknown") formData.append("remoteip", ip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    return {
      ok: false,
      error: "Controllo sicurezza non valido.",
    };
  }

  return { ok: true };
}

export async function POST(req: Request) {
  try {
    const admin = supabaseAdmin();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const ip_hash = hashIp(ip);

    const body = await req.json().catch(() => ({}));

    // 🔐 TURNSTILE
    const turnstileToken = String(body?.turnstileToken || "").trim();

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Controllo sicurezza mancante." },
        { status: 400 }
      );
    }

    const turnstile = await verifyTurnstileToken(turnstileToken, ip);

    if (!turnstile.ok) {
      return NextResponse.json(
        { error: "Controllo sicurezza non valido." },
        { status: 400 }
      );
    }

    // 📦 DATI
    const contact_email = String(body?.contact_email || "")
      .trim()
      .toLowerCase();

    const contact_phone =
      body?.contact_phone == null
        ? null
        : String(body.contact_phone).trim() || null;

    const type =
      body?.type === "lost" ||
      body?.type === "found" ||
      body?.type === "sighted"
        ? body.type
        : null;

    const animal_name = String(body?.animal_name || "").trim();

    const species = String(body?.species || "").trim() || null;

    const location_text = String(body?.location_text || "").trim() || null;

    const event_date = String(body?.event_date || "").trim() || null;

    const description = String(body?.description || "").trim() || null;

    const lat =
      typeof body?.lat === "number" && Number.isFinite(body.lat)
        ? body.lat
        : null;

    const lng =
      typeof body?.lng === "number" && Number.isFinite(body.lng)
        ? body.lng
        : null;

    // ✅ VALIDAZIONE
    if (!animal_name || !contact_email || !type) {
      return NextResponse.json(
        { error: "Dati mancanti" },
        { status: 400 }
      );
    }

    // ⛔ RATE LIMIT
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const { count, error: countErr } = await admin
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ip_hash)
      .gte("created_at", since);

    if (countErr) {
      return NextResponse.json(
        { error: countErr.message },
        { status: 400 }
      );
    }

    const limit = Number(body?.rate_limit ?? 10);

    if ((count || 0) >= limit) {
      return NextResponse.json(
        { error: "Limite creazione annunci raggiunto. Riprova più tardi." },
        { status: 429 }
      );
    }

    // 💾 INSERT
    const insertRow = {
      animal_name,
      contact_email,
      contact_phone,
      type,
      species,
      location_text,
      event_date,
      description,
      lat,
      lng,
      ip_hash,
    };

    const { data, error } = await admin
      .from("reports")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // 📧 EMAIL
    try {
      await sendReportCreatedEmail({
        to: contact_email,
        type,
        reportId: data.id,
        animalName: animal_name,
      });
    } catch (mailError) {
      console.error("EMAIL ERROR:", mailError);
    }

    return NextResponse.json(
      { ok: true, report: data },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Errore server" },
      { status: 500 }
    );
  }
}