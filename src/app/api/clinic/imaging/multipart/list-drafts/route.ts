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
    const animalId = String(searchParams.get("animalId") || "").trim();

    if (!animalId) {
      return NextResponse.json({ error: "animalId obbligatorio." }, { status: 400 });
    }

    const { data, error } = await admin
      .from("clinic_imaging_upload_sessions")
      .select("*")
      .eq("created_by_user_id", user.id)
      .eq("animal_id", animalId)
      .in("status", ["initiated", "uploading"])
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const drafts = (data || []).map((row: any) => {
      const uploadedPartNumbers = Array.isArray(row.uploaded_parts)
        ? row.uploaded_parts
            .map((n: any) => Number(n))
            .filter((n: number) => Number.isInteger(n) && n > 0)
            .sort((a: number, b: number) => a - b)
        : [];

      const fileSize = Number(row.file_size || 0);
      const partSize = Number(row.part_size || 0);

      let uploadedBytes = 0;
      for (const partNumber of uploadedPartNumbers) {
        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, fileSize);
        uploadedBytes += Math.max(0, end - start);
      }

      const percent =
        fileSize > 0 ? Math.min(100, Math.round((uploadedBytes / fileSize) * 100)) : 0;

      return {
        id: row.id,
        uploadId: row.upload_id,
        fileName: row.file_name,
        fileSize,
        modality: row.modality,
        bodyPart: row.body_part,
        status: row.status,
        updatedAt: row.updated_at,
        uploadedPartNumbers,
        percent,
      };
    });

    return NextResponse.json({
      ok: true,
      drafts,
    });
  } catch (err: any) {
    console.error("IMAGING MULTIPART LIST-DRAFTS ERROR:", err);

    return NextResponse.json(
      {
        error: err?.message || "List drafts error",
      },
      { status: 500 }
    );
  }
}