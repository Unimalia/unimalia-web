import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { animalId, fileName, fileSize, fileType } = body;

    if (!animalId || !fileName || !fileSize) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // ⚠️ qui devi già avere user autenticato lato route (lo aggiungiamo dopo)
    const userId = body.userId || null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔐 permessi
    const grant = await requireOwnerOrGrant(admin, userId, animalId, "upload");

    if (!grant.ok) {
      return NextResponse.json({ error: grant.reason }, { status: 403 });
    }

    const partSize = 5 * 1024 * 1024; // 5MB
    const totalParts = Math.ceil(fileSize / partSize);

    const sessionId = randomUUID();
    const storageKey = `imaging/${animalId}/${sessionId}_${fileName}`;

    // ⚠️ MOCK uploadId (poi lo colleghiamo a R2 reale)
    const uploadId = randomUUID();

    const { error } = await admin.from("clinic_imaging_upload_sessions").insert({
      id: sessionId,
      animal_id: animalId,
      created_by: userId,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType || null,
      storage_key: storageKey,
      upload_id: uploadId,
      part_size: partSize,
      total_parts: totalParts,
      uploaded_parts: [],
      status: "initiated",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        sessionId,
        uploadId,
        storageKey,
        partSize,
        totalParts,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Init error" },
      { status: 500 }
    );
  }
}