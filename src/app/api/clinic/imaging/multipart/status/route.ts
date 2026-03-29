import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getBearerToken } from "@/lib/server/bearer";

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

    if (!uploadId) {
      return NextResponse.json({ error: "uploadId obbligatorio." }, { status: 400 });
    }

    const { data: session, error: sessionErr } = await admin
      .from("clinic_imaging_upload_sessions")
      .select("*")
      .eq("upload_id", uploadId)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Upload session non trovata." }, { status: 404 });
    }

    if (String(session.created_by_user_id) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fileSize = Number(session.file_size || 0);
    const totalParts = Number(session.total_parts || 0);

    const uploadedPartNumbers = Array.isArray(session.uploaded_parts)
      ? session.uploaded_parts
          .map((n: any) => Number(n))
          .filter((n: number) => Number.isInteger(n) && n > 0)
          .sort((a: number, b: number) => a - b)
      : [];

    const partSize = Number(session.part_size || 0);

    let uploadedBytes = 0;

    for (const partNumber of uploadedPartNumbers) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, fileSize);
      uploadedBytes += Math.max(0, end - start);
    }

    const percent =
      fileSize > 0 ? Math.min(100, Math.round((uploadedBytes / fileSize) * 100)) : 0;

    const remainingParts: number[] = [];
    for (let i = 1; i <= totalParts; i++) {
      if (!uploadedPartNumbers.includes(i)) {
        remainingParts.push(i);
      }
    }

    return NextResponse.json({
      ok: true,
      uploadId,
      uploadedPartNumbers,
      uploadedPartsCount: uploadedPartNumbers.length,
      remainingParts,
      uploadedBytes,
      fileSize,
      totalParts,
      status: session.status,
      fileName: session.file_name,
      animalId: session.animal_id,
      percent,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error("IMAGING MULTIPART STATUS ERROR:", err);

    return NextResponse.json(
      {
        error: err?.message || "Status error",
      },
      { status: 500 }
    );
  }
}