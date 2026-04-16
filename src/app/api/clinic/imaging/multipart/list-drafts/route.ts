import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin, createServerSupabaseClient } from "@/lib/supabase/server";
import { getBearerToken } from "@/lib/server/bearer";

type UploadedPartValue = number | string | { PartNumber?: number | string } | null;

type ImagingUploadSessionRow = {
  id: string;
  upload_id: string | null;
  file_name: string | null;
  file_size: number | string | null;
  part_size: number | string | null;
  modality: string | null;
  body_part: string | null;
  status: string | null;
  updated_at: string | null;
  uploaded_parts: UploadedPartValue[] | null;
};

type AuthenticatedUserResult = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: {
    id: string;
    email?: string | null;
  };
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

async function resolveAuthenticatedUser(req: Request): Promise<AuthenticatedUserResult | null> {
  const token = getBearerToken(req);

  if (token) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      throw new Error("Server misconfigured (Supabase env missing)");
    }

    const bearerSupabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const bearerUserResp = await bearerSupabase.auth.getUser(token);

    if (!bearerUserResp.error && bearerUserResp.data?.user) {
      return {
        supabase: bearerSupabase as Awaited<ReturnType<typeof createServerSupabaseClient>>,
        user: bearerUserResp.data.user,
      };
    }

    console.error("[IMAGING MULTIPART LIST-DRAFTS AUTH] bearer failed", {
      hasToken: true,
      error: bearerUserResp.error?.message ?? null,
    });
  }

  const cookieSupabase = await createServerSupabaseClient();
  const cookieUserResp = await cookieSupabase.auth.getUser();

  if (!cookieUserResp.error && cookieUserResp.data?.user) {
    return {
      supabase: cookieSupabase,
      user: cookieUserResp.data.user,
    };
  }

  console.error("[IMAGING MULTIPART LIST-DRAFTS AUTH] cookie failed", {
    error: cookieUserResp.error?.message ?? null,
  });

  return null;
}

export async function GET(req: Request) {
  try {
    const auth = await resolveAuthenticatedUser(req);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = auth;
    const admin = supabaseAdmin();

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
      .order("updated_at", { ascending: false })
      .returns<ImagingUploadSessionRow[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const drafts = (data || []).map((row) => {
      const uploadedPartNumbers = Array.isArray(row.uploaded_parts)
        ? row.uploaded_parts
            .map(normalizePartNumber)
            .filter((n): n is number => n !== null)
            .sort((a, b) => a - b)
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
  } catch (err: unknown) {
    console.error("IMAGING MULTIPART LIST-DRAFTS ERROR:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "List drafts error",
      },
      { status: 500 }
    );
  }
}