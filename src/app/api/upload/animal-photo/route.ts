import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const BUCKET = "animal-photos";
const PROFILE_FOLDER = "profiles";

function extFromFileName(name: string) {
  const n = (name || "").toLowerCase();
  const m = n.match(/\.([a-z0-9]+)$/);
  return m?.[1] || "jpg";
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    // 1) verifica utente via access token (dal client)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const supaVerify = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await supaVerify.auth.getUser(token);

    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // 2) leggi file
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3) upload su Storage con service role (server)
    const supaAdmin = createClient(supabaseUrl, serviceKey);

    const ext = extFromFileName(file.name);
    const fileName = `animal_${Date.now()}.${ext}`;
    const path = `${PROFILE_FOLDER}/${userId}/${fileName}`;

    const { error: upErr } = await supaAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        upsert: true,
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

    return NextResponse.json({ publicUrl });
  } catch (e: any) {
    console.error("UPLOAD API ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Server upload error" },
      { status: 500 }
    );
  }
}