import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const PART_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const admin = supabaseAdmin();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { fileName, fileSize, fileType, animalId, modality, bodyPart } = body;

  if (!fileName || !fileSize || !animalId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // 🔥 cerca sessione esistente
  const { data: existing } = await admin
    .from("clinic_imaging_upload_sessions")
    .select("*")
    .eq("created_by", user.id)
    .eq("animal_id", animalId)
    .eq("file_name", fileName)
    .eq("file_size", fileSize)
    .in("status", ["initiated", "uploading"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
      created_by: user.id,
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
    return NextResponse.json({ error: error?.message }, { status: 500 });
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