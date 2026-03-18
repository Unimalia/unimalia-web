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

function extFromFileName(name: string) {
  const n = (name || "").toLowerCase();
  const m = n.match(/\.([a-z0-9]+)$/);
  return m?.[1] || "jpg";
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Configurazione Supabase mancante." },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File mancante." }, { status: 400 });
    }

    const mime = String(file.type || "").toLowerCase();

    if (EXPLICITLY_UNSUPPORTED_IOS_TYPES.has(mime)) {
      return NextResponse.json(
        {
          error:
            "La foto selezionata è in formato HEIC/HEIF (tipico di iPhone) e al momento non è supportata. Salva o esporta la foto come JPG/PNG e riprova.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json(
        { error: "Formato file non valido. Usa JPG, PNG, WEBP o GIF." },
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
        contentType: mime || "image/jpeg",
        cacheControl: "3600",
      });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: pub } = supaAdmin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl ? `${pub.publicUrl}?t=${Date.now()}` : "";

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Foto caricata ma URL pubblico non disponibile." },
        { status: 500 }
      );
    }

    return NextResponse.json({ publicUrl }, { status: 200 });
  } catch (e: any) {
    console.error("REPORT PHOTO UPLOAD ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Errore server durante upload foto." },
      { status: 500 }
    );
  }
}