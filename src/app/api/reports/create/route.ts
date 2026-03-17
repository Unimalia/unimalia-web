import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, EMAIL_FROM_NO_REPLY, getBaseUrl } from "@/lib/email/resend";
import { verificationEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

function hashIp(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function buildTitle(params: {
  type: "lost" | "found" | "sighted";
  animalName?: string | null;
  species: string;
  province: string;
}) {
  const who = params.animalName?.trim() || params.species;
  const place = params.province.trim();

  if (params.type === "lost") return `Smarrimento - ${who} - ${place}`;
  if (params.type === "found") return `Animale trovato - ${who} - ${place}`;
  return `Avvistamento - ${who} - ${place}`;
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
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

    const animal_name =
      body?.animal_name == null ? null : String(body.animal_name).trim() || null;

    const species = String(body?.species || "").trim();
    const region = String(body?.region || "").trim();
    const province = String(body?.province || "").trim();
    const location_text = String(body?.location_text || "").trim();
    const event_date = String(body?.event_date || "").trim();
    const description = String(body?.description || "").trim() || null;

    const contact_mode =
      body?.contact_mode === "protected" || body?.contact_mode === "phone_public"
        ? body.contact_mode
        : "protected";

    const consent = body?.consent === true;

    const lat =
      typeof body?.lat === "number" && Number.isFinite(body.lat)
        ? body.lat
        : null;

    const lng =
      typeof body?.lng === "number" && Number.isFinite(body.lng)
        ? body.lng
        : null;

    const photo_urls = Array.isArray(body?.photo_urls) ? body.photo_urls : [];

    if (!contact_email || !type || !species || !region || !province || !location_text || !event_date) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    if (type === "lost" && !animal_name) {
      return NextResponse.json(
        { error: "Per lo smarrimento il nome animale è obbligatorio." },
        { status: 400 }
      );
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

    const verify_token = crypto.randomUUID();
    const claim_token = crypto.randomUUID();

    const title = buildTitle({
      type,
      animalName: animal_name,
      species,
      province,
    });

    const email_verified = type === "found" || type === "sighted";

    const insertRow = {
      type,
      status: "active",
      title,
      animal_name,
      species,
      region,
      province,
      location_text,
      event_date,
      description,
      photo_urls,
      contact_email,
      contact_phone,
      contact_mode,
      email_verified,
      verify_token,
      claim_token,
      created_by_user_id: null,
      ip_hash,
      consent,
      lat,
      lng,
      expires_at: addDaysIso(90),
    };

    const { data, error } = await admin
      .from("reports")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (type === "lost") {
      try {
        const verifyUrl = `${getBaseUrl()}/verifica/${verify_token}`;

        await resend.emails.send({
          from: EMAIL_FROM_NO_REPLY,
          to: contact_email,
          subject: "Conferma il tuo annuncio su UNIMALIA",
          html: `
            <h2>Conferma il tuo annuncio</h2>

            <p>Clicca qui per pubblicarlo:</p>

            <p>
              <a href="${verifyUrl}" style="color:#fff;background:#000;padding:10px 14px;border-radius:6px;text-decoration:none;">
                Conferma annuncio
              </a>
            </p>

            <p style="margin-top:20px;font-size:12px;color:#666;">
              Se non hai richiesto tu questo annuncio, ignora questa email.
            </p>
          `,
        });
      } catch (mailError) {
        console.error("VERIFY EMAIL ERROR:", mailError);
      }
    }

    return NextResponse.json({ ok: true, report: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Errore server" },
      { status: 500 }
    );
  }
}