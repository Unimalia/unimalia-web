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
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";

type OrthancUploadResponse = {
  ID?: string;
  ParentStudy?: string;
  ParentSeries?: string;
  ParentPatient?: string;
  StudyInstanceUID?: string | null;
};

type UploadedPartValue = number | string | { PartNumber?: number | string } | null;

type ImagingUploadSessionRow = {
  id: string;
  animal_id: string | null;
  created_by_user_id: string | null;
  storage_key: string;
  uploaded_parts: UploadedPartValue[] | null;
  total_parts: number;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
};

type CompleteBody = {
  sessionId?: string;
  animalId?: string;
  modality?: string | null;
  bodyPart?: string | null;
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

async function uploadToOrthanc(buffer: Buffer): Promise<OrthancUploadResponse> {
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
    cache: "no-store",
  });

  const json = (await resp.json().catch(() => null)) as OrthancUploadResponse | null;

  if (!resp.ok || !json?.ID) {
    throw new Error("Upload Orthanc fallito");
  }

  const tagsResp = await fetch(`${baseUrl}/instances/${json.ID}/simplified-tags`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const tags = (await tagsResp.json().catch(() => null)) as
    | { StudyInstanceUID?: string | null }
    | null;

  return {
    ...json,
    StudyInstanceUID: tags?.StudyInstanceUID ?? null,
  };
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

    const body = (await req.json()) as CompleteBody;

    const sessionId = body.sessionId;
    const animalId = body.animalId;
    const modality = body.modality || null;
    const bodyPart = body.bodyPart || null;

    if (!sessionId || !animalId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "upload");

    if (!grant.ok) {
      return NextResponse.json({ error: grant.reason }, { status: 403 });
    }

    const { data: session } = await admin
      .from("clinic_imaging_upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .single<ImagingUploadSessionRow>();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (String(session.created_by_user_id) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (String(session.animal_id || "") !== animalId) {
      return NextResponse.json({ error: "Animal mismatch" }, { status: 400 });
    }

    const parts = Array.isArray(session.uploaded_parts)
      ? session.uploaded_parts
          .map(normalizePartNumber)
          .filter((n): n is number => n !== null)
          .map((PartNumber) => ({ PartNumber }))
      : [];

    const totalParts = session.total_parts;

    if (parts.length !== totalParts) {
      return NextResponse.json({ error: "Upload incompleto" }, { status: 400 });
    }

    const buffers: Buffer[] = [];

    for (const part of parts.sort((a, b) => a.PartNumber - b.PartNumber)) {
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
              studyInstanceUid: orthanc.StudyInstanceUID ?? null,
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
  } catch (err: unknown) {
    console.error("MULTIPART COMPLETE ERROR:", err);

    if (uploadedFinalPath) {
      await deletePrivateFile(uploadedFinalPath).catch(() => {});
    }

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Complete error",
      },
      { status: 500 }
    );
  }
}