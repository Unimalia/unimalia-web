import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  createSignedDownloadUrl,
  createSignedUploadUrl,
  deletePrivateFile,
} from "@/lib/storage";
import { randomUUID } from "crypto";
import { getBearerToken } from "@/lib/server/bearer";

async function uploadToOrthanc(buffer: Buffer) {
  const baseUrl = process.env.ORTHANC_BASE_URL;
  const username = process.env.ORTHANC_USERNAME;
  const password = process.env.ORTHANC_PASSWORD;

  if (!baseUrl || !username || !password) {
    throw new Error("Orthanc env mancanti");
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  const resp = await fetch(`${baseUrl}/instances`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/dicom",
    },
    body: new Uint8Array(buffer),
  });

  const json = await resp.json().catch(() => null);

  if (!resp.ok || !json?.ID) {
    throw new Error("Upload Orthanc fallito");
  }

  return json;
}

export async function POST(req: Request) {
  let uploadedFinalPath: string | null = null;

  try {
    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl!, supabaseAnon!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const admin = supabaseAdmin();

    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const sessionId = body.sessionId;
    const animalId = body.animalId;
    const modality = body.modality || null;
    const bodyPart = body.bodyPart || null;

    if (!sessionId || !animalId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const { data: session } = await admin
      .from("clinic_imaging_upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const parts = session.uploaded_parts || [];
    const totalParts = session.total_parts;

    if (parts.length !== totalParts) {
      return NextResponse.json({ error: "Upload incompleto" }, { status: 400 });
    }

    const buffers: Buffer[] = [];

    for (const part of parts.sort((a: any, b: any) => a.PartNumber - b.PartNumber)) {
      const path = `${session.storage_key}.part${part.PartNumber}`;

      const url = await createSignedDownloadUrl(path, 60);
      const resp = await fetch(url);

      if (!resp.ok) {
        throw new Error("Errore download chunk");
      }

      const arrayBuffer = await resp.arrayBuffer();
      buffers.push(Buffer.from(arrayBuffer));
    }

    const finalBuffer = Buffer.concat(buffers);
    const finalPath = session.storage_key;

    const upload = await createSignedUploadUrl({
      path: finalPath,
      contentType: "application/octet-stream",
      expiresInSeconds: 60 * 15,
    });

    const uploadResp = await fetch(upload.url, {
      method: "PUT",
      body: new Uint8Array(finalBuffer),
    });

    if (!uploadResp.ok) {
      throw new Error("Upload finale fallito");
    }

    uploadedFinalPath = finalPath;

    const orthanc = await uploadToOrthanc(finalBuffer);

    const eventId = randomUUID();
    const fileId = randomUUID();

    const eventMeta = {
      imaging: {
        modality,
        body_part: bodyPart,
        files: [
          {
            id: fileId,
            path: finalPath,
            name: session.file_name,
            size: session.file_size,
            mime: session.file_type,
            orthanc: {
              studyId: orthanc.ParentStudy,
              seriesId: orthanc.ParentSeries,
              instanceId: orthanc.ID,
              patientId: orthanc.ParentPatient,
            },
          },
        ],
      },
      has_attachments: true,
    };

    await admin.from("animal_clinic_events").insert({
      id: eventId,
      animal_id: animalId,
      type: "imaging",
      title: modality || "Imaging",
      meta: eventMeta,
      created_by_user_id: user.id,
      source: "professional",
      status: "active",
    });

    await admin.from("animal_clinic_event_files").insert({
      id: fileId,
      event_id: eventId,
      animal_id: animalId,
      path: finalPath,
      filename: session.file_name,
      mime: session.file_type,
      size: session.file_size,
      created_by_user_id: user.id,
    });

    await admin
      .from("clinic_imaging_upload_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    for (const part of parts) {
      const path = `${session.storage_key}.part${part.PartNumber}`;
      await deletePrivateFile(path).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      data: {
        eventId,
        fileId,
        path: finalPath,
      },
    });
  } catch (err: any) {
    console.error("MULTIPART COMPLETE ERROR:", err);

    if (uploadedFinalPath) {
      await deletePrivateFile(uploadedFinalPath).catch(() => {});
    }

    return NextResponse.json(
      {
        error: err?.message || "Complete error",
      },
      { status: 500 }
    );
  }
}