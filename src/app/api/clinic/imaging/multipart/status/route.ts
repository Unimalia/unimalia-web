import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getBearerToken } from "@/lib/server/bearer";

type UploadedPartValue = number | string | { PartNumber?: number | string } | null;

type ImagingUploadSessionRow = {
  id: string;
  created_by_user_id: string | null;
  file_size: number | string | null;
  total_parts: number | string | null;
  uploaded_parts: UploadedPartValue[] | null;
  part_size: number | string | null;
  status: string | null;
  file_name: string | null;
  animal_id: string | null;
};

function normalizePartNumber(value: UploadedPartValue): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  if (value && typeof value === "object") {
    const partNumber = value.PartNumber;
    if (typeof partNumber === "number") {
      return Number.isInteger(partNumber) && partNumber > 0 ? partNumber : null;
    }
    if (typeof partNumber === "string") {
      const parsed = Number(partNumber);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }
  }

  return null;
}

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
      .single<ImagingUploadSessionRow>();

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
          .map(normalizePartNumber)
          .filter((n): n is number => n !== null)
          .sort((a, b) => a - b)
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
  } catch (err: unknown) {
    console.error("IMAGING MULTIPART STATUS ERROR:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Status error",
      },
      { status: 500 }
    );
  }
}
