import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createSignedUploadUrl } from "@/lib/storage";
import { getBearerToken } from "@/lib/server/bearer";

type ImagingUploadSessionRow = {
  created_by: string | null;
  storage_key: string | null;
  status: string | null;
  file_type: string | null;
};

export async function GET(req: Request) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json(
        { error: "Server misconfigured (Supabase env missing)" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const admin = supabaseAdmin();

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const user = userData?.user;

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const uploadId = String(searchParams.get("uploadId") || "").trim();
    const key = String(searchParams.get("key") || "").trim();
    const partNumber = Number(searchParams.get("partNumber"));

    if (!uploadId || !key || !Number.isInteger(partNumber) || partNumber <= 0) {
      return NextResponse.json(
        { error: "uploadId, key e partNumber sono obbligatori." },
        { status: 400 }
      );
    }

    const { data: session, error: sessionErr } = await admin
      .from("clinic_imaging_upload_sessions")
      .select("*")
      .eq("upload_id", uploadId)
      .single<ImagingUploadSessionRow>();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Upload session non trovata." }, { status: 404 });
    }

    if (String(session.created_by) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (String(session.storage_key) !== key) {
      return NextResponse.json(
        { error: "key non coerente con la upload session." },
        { status: 400 }
      );
    }

    if (session.status === "completed") {
      return NextResponse.json(
        { error: "Upload session già completata." },
        { status: 400 }
      );
    }

    if (session.status === "aborted") {
      return NextResponse.json(
        { error: "Upload session annullata." },
        { status: 400 }
      );
    }

    const partPath = `${key}.part${partNumber}`;

    const signed = await createSignedUploadUrl({
      path: partPath,
      contentType: session.file_type || "application/octet-stream",
      expiresInSeconds: 60 * 15,
    });

    return NextResponse.json({
      ok: true,
      url: signed.url,
      path: partPath,
      partNumber,
    });
  } catch (err: unknown) {
    console.error("IMAGING MULTIPART PART-URL ERROR:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Part URL error",
      },
      { status: 500 }
    );
  }
}