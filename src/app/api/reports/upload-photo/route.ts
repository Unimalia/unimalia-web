import "server-only";
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

const EXPLICITLY_UNSUPPORTED_IOS_TYPES = new Set([
  "image/heic",
  "image/heif",
]);

function extFromFileName(name: string, mime: string) {
  const n = (name || "").toLowerCase();
  const m = n.match(/\.([a-z0-9]+)$/);
  const ext = m?.[1] || "";

  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }

  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const mime = String(file.type || "").toLowerCase();

    if (EXPLICITLY_UNSUPPORTED_IOS_TYPES.has(mime)) {
      return NextResponse.json(
        {
          error:
            "Formato HEIC/HEIF non supportato. Salva o esporta la foto come JPG, PNG, WEBP o GIF e riprova.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json(
        { error: "Formato file non valido." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File troppo grande (max 8 MB)." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supaAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const ext = extFromFileName(file.name, mime);
    const fileName = `report_${Date.now()}_${randomSuffix()}.${ext}`;
    const dayKey = new Date().toISOString().slice(0, 10);
    const path = `${REPORTS_FOLDER}/${dayKey}/${crypto.randomUUID()}_${fileName}`;

    const { error: upErr } = await supaAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        upsert: false,
        contentType: mime || "image/jpeg",
        cacheControl: "3600",
      });

    if (upErr) {
      console.error("report photo upload storage error");
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: pub } = supaAdmin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl ? `${pub.publicUrl}?t=${Date.now()}` : "";

    if (!publicUrl) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ publicUrl }, { status: 200 });
  } catch {
    console.error("report photo upload error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
