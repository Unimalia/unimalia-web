import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin, createServerSupabaseClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { getBearerToken } from "@/lib/server/bearer";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";

const PART_SIZE = 5 * 1024 * 1024;

type AuthenticatedUserResult = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: {
    id: string;
    email?: string | null;
  };
};

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

    console.error("[IMAGING MULTIPART INIT AUTH] bearer failed", {
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

  console.error("[IMAGING MULTIPART INIT AUTH] cookie failed", {
    error: cookieUserResp.error?.message ?? null,
  });

  return null;
}

export async function POST(req: Request) {
  const auth = await resolveAuthenticatedUser(req);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabase, user } = auth;
  const admin = supabaseAdmin();

  const body = await req.json();

  const { fileName, fileSize, fileType, animalId, modality, bodyPart } = body;

  if (!fileName || !fileSize || !animalId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "upload");

  if (!grant.ok) {
    return NextResponse.json({ error: grant.reason }, { status: 403 });
  }

  const { data: existing, error: existingError } = await admin
    .from("clinic_imaging_upload_sessions")
    .select("*")
    .eq("created_by_user_id", user.id)
    .eq("animal_id", animalId)
    .eq("file_name", fileName)
    .eq("file_size", fileSize)
    .in("status", ["initiated", "uploading"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({
      uploadId: existing.upload_id,
      sessionId: existing.id,
      key: existing.storage_key,
      partSize: existing.part_size,
      totalParts: existing.total_parts,
      resumed: true,
    });
  }

  const totalParts = Math.ceil(fileSize / PART_SIZE);
  const uploadId = randomUUID();
  const key = `${animalId}/${randomUUID()}_${fileName}`;

  const { data: inserted, error } = await admin
    .from("clinic_imaging_upload_sessions")
    .insert({
      animal_id: animalId,
      created_by_user_id: user.id,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      modality,
      body_part: bodyPart,
      storage_key: key,
      upload_id: uploadId,
      part_size: PART_SIZE,
      total_parts: totalParts,
      uploaded_parts: [],
      status: "initiated",
    })
    .select("*")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message || "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({
    uploadId,
    sessionId: inserted.id,
    key,
    partSize: PART_SIZE,
    totalParts,
    resumed: false,
  });
}