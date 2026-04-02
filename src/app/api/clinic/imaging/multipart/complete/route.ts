import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  createSignedDownloadUrl,
  createSignedUploadUrl,
  deletePrivateFile,
} from "@/lib/storage";
import { getBearerToken } from "@/lib/server/bearer";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";

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
  status: string | null;
};

type CompleteBody = {
  uploadId?: string;
  animalId?: string;
  key?: string;
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

    const uploadId = String(body.uploadId || "").trim();
    const animalId = String(body.animalId || "").trim();
    const key = String(body.key || "").trim();

    if (!uploadId || !animalId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "upload");

    if (!grant.ok) {
      return NextResponse.json({ error: grant.reason }, { status: 403 });
    }

    const { data: session } = await admin
      .from("clinic_imaging_upload_sessions")
      .select("*")
      .eq("upload_id", uploadId)
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

    if (key && String(session.storage_key) !== key) {
      return NextResponse.json({ error: "Storage key mismatch" }, { status: 400 });
    }

    if (session.status === "completed") {
      return NextResponse.json({
        ok: true,
        data: {
          uploadId,
          path: session.storage_key,
          fileName: session.file_name,
          fileSize: session.file_size,
          fileType: session.file_type,
        },
      });
    }

    const parts = Array.isArray(session.uploaded_parts)
      ? session.uploaded_parts
          .map(normalizePartNumber)
          .filter((n): n is number => n !== null)
          .sort((a, b) => a - b)
      : [];

    const totalParts = Number(session.total_parts || 0);

    if (parts.length !== totalParts) {
      return NextResponse.json({ error: "Upload incompleto" }, { status: 400 });
    }

    const buffers: Buffer[] = [];

    for (const partNumber of parts) {
      const path = `${session.storage_key}.part${partNumber}`;

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
      contentType: session.file_type || "application/octet-stream",
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

    const { error: completeError } = await admin
      .from("clinic_imaging_upload_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("upload_id", uploadId);

    if (completeError) {
      throw new Error(completeError.message);
    }

    for (const partNumber of parts) {
      const path = `${session.storage_key}.part${partNumber}`;
      await deletePrivateFile(path).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      data: {
        uploadId,
        path: finalPath,
        fileName: session.file_name,
        fileSize: session.file_size,
        fileType: session.file_type,
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