import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadPrivateFile, deletePrivateFile } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase/server";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-]+/g, "_");
}

function buildImagingTitle(modality?: string | null, bodyPart?: string | null) {
  const cleanModality = modality?.trim() || "Imaging";
  const cleanBodyPart = bodyPart?.trim();

  return cleanBodyPart ? `${cleanModality} ${cleanBodyPart}` : cleanModality;
}

export async function POST(req: Request) {
  let uploadedPath: string | null = null;

  try {
    const supabase = supabaseAdmin();

    const formData = await req.formData();

    const file = formData.get("file");
    const animalId = formData.get("animalId");
    const modality = formData.get("modality");
    const bodyPart = formData.get("bodyPart");
    const description = formData.get("description");
    const visibility = formData.get("visibility");
    const eventDate = formData.get("eventDate");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File mancante" }, { status: 400 });
    }

    if (!animalId) {
      return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
    }

    const allowedImagingMimeTypes = new Set([
      "application/dicom",
      "application/pdf",
      "image/jpeg",
      "image/png",
    ]);

    const allowedImagingExtensions = [".dcm", ".dicom", ".pdf", ".jpg", ".jpeg", ".png"];

    const lowerName = String(file.name || "").toLowerCase();
    const hasAllowedExtension = allowedImagingExtensions.some((ext) => lowerName.endsWith(ext));
    const hasAllowedMime = !file.type || allowedImagingMimeTypes.has(file.type);

    if (!hasAllowedExtension && !hasAllowedMime) {
      return NextResponse.json(
        {
          error: "Formato imaging non consentito. Usa DCM, DICOM, PDF, JPG o PNG.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "File imaging non valido." }, { status: 400 });
    }

    if (typeof animalId !== "string" || !animalId.trim()) {
      return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
    }

    const eventId = randomUUID();
    const fileId = randomUUID();

    const safeFileName = sanitizeFileName(file.name);
    const timestampPrefix = Date.now();
    const storedFileName = `${timestampPrefix}_${safeFileName}`;
    const path = `${animalId}/${eventId}/${storedFileName}`;
    uploadedPath = path;

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "application/octet-stream";

    await uploadPrivateFile({
      path,
      body: buffer,
      contentType: mime,
    });

    const finalModality =
      typeof modality === "string" && modality.trim() ? modality.trim() : null;

    const finalBodyPart =
      typeof bodyPart === "string" && bodyPart.trim() ? bodyPart.trim() : null;

    const finalDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : null;

    const finalVisibility =
      typeof visibility === "string" && visibility.trim()
        ? visibility.trim()
        : "owner";

    const finalEventDate =
      typeof eventDate === "string" && eventDate.trim()
        ? new Date(eventDate).toISOString()
        : new Date().toISOString();

    const title = buildImagingTitle(finalModality, finalBodyPart);

    const eventMeta = {
      has_attachments: true,
      imaging: {
        modality: finalModality,
        body_part: finalBodyPart,
        files: [
          {
            id: fileId,
            path,
            name: safeFileName,
            size: file.size,
            mime,
          },
        ],
      },
    };

    const { error: eventInsertError } = await supabase
      .from("animal_clinic_events")
      .insert({
        id: eventId,
        animal_id: animalId,
        event_date: finalEventDate,
        type: "imaging",
        title,
        description: finalDescription,
        visibility: finalVisibility,
        meta: eventMeta,
        created_by: null,
        source: "professional",
        status: "active",
      });

    if (eventInsertError) {
      throw new Error(`Errore salvataggio evento clinico: ${eventInsertError.message}`);
    }

    const { error: fileInsertError } = await supabase
      .from("animal_clinic_event_files")
      .insert({
        id: fileId,
        event_id: eventId,
        animal_id: animalId,
        path,
        filename: safeFileName,
        mime,
        size: file.size,
        created_by: null,
      });

    if (fileInsertError) {
      throw new Error(`Errore salvataggio file evento: ${fileInsertError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        eventId,
        fileId,
        animalId,
        path,
        type: "imaging",
        title,
        visibility: finalVisibility,
        imaging: {
          modality: finalModality,
          body_part: finalBodyPart,
          files: [
            {
              id: fileId,
              path,
              name: safeFileName,
              size: file.size,
              mime,
            },
          ],
        },
      },
    });
  } catch (err: any) {
    console.error("UPLOAD IMAGING ERROR:", err);

    if (uploadedPath) {
      try {
        await deletePrivateFile(uploadedPath);
      } catch (cleanupErr) {
        console.error("UPLOAD CLEANUP ERROR:", cleanupErr);
      }
    }

    return NextResponse.json(
      {
        error: "Errore upload imaging",
        details: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}