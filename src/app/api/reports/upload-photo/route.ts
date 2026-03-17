import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "animal-photos";
const REPORTS_FOLDER = "reports";
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extFromFileName(name: string) {
  const n = (name || "").toLowerCase();
  const m = n.match(/\.([a-z0-9]+)$/);
  return m?.[1] || "jpg";
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
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
    return { ok: false, error: "Controllo sicurezza non valido." };
  }

  return { ok: true };
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const form = await req.formData();

    const file = form.get("file") as File | null;
    const turnstileToken = String(form.get("turnstileToken") || "").trim();

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Controllo sicurezza mancante." },
        { status: 400 }
      );
    }

    const turnstile = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: turnstile.error || "Controllo sicurezza non valido." },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type || "")) {
      return NextResponse.json({ error: "Formato file non valido" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File troppo grande (max 8MB)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supaAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const ext = extFromFileName(file.name);
    const fileName = `report_${Date.now()}_${randomSuffix()}.${ext}`;
    const dayKey = new Date().toISOString().slice(0, 10);
    const path = `${REPORTS_FOLDER}/${dayKey}/${crypto.randomUUID()}_${fileName}`;

    const { error: upErr } = await supaAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        upsert: false,
        contentType: file.type || "image/jpeg",
        cacheControl: "3600",
      });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: pub } = supaAdmin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl ? `${pub.publicUrl}?t=${Date.now()}` : "";

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Uploaded but public URL not available" },
        { status: 500 }
      );
    }

    return NextResponse.json({ publicUrl }, { status: 200 });
  } catch (e: any) {
    console.error("REPORT PHOTO UPLOAD ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Server upload error" },
      { status: 500 }
    );
  }
}