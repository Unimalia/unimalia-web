import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  createProfessionalConsultMessageFiles,
  getCurrentProfessionalContext,
} from "@/lib/professionisti/consults";

const CONSULT_MESSAGE_FILES_BUCKET = "professional-consults";
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

function sanitizeFilename(filename: string) {
  return filename
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(req: NextRequest) {
  try {
    const admin = supabaseAdmin();
    const ctx = await getCurrentProfessionalContext();

    const formData = await req.formData();

    const consultId = String(formData.get("consultId") || "").trim();
    const messageId = String(formData.get("messageId") || "").trim();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (!isUuid(consultId)) {
      return NextResponse.json({ error: "consultId non valido" }, { status: 400 });
    }

    if (!isUuid(messageId)) {
      return NextResponse.json({ error: "messageId non valido" }, { status: 400 });
    }

    if (!files.length) {
      return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
    }

    const { data: consult, error: consultError } = await admin
      .from("professional_consult_requests")
      .select("id,sender_professional_id,receiver_professional_id,status")
      .eq("id", consultId)
      .maybeSingle();

    if (consultError) {
      return NextResponse.json({ error: consultError.message }, { status: 400 });
    }

    if (!consult) {
      return NextResponse.json({ error: "Consulto non trovato" }, { status: 404 });
    }

    const isParticipant =
      consult.sender_professional_id === ctx.professional.id ||
      consult.receiver_professional_id === ctx.professional.id;

    if (!isParticipant) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const { data: message, error: messageError } = await admin
      .from("professional_consult_messages")
      .select("id,consult_id")
      .eq("id", messageId)
      .eq("consult_id", consultId)
      .maybeSingle();

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json(
        { error: "Messaggio consulto non trovato" },
        { status: 404 }
      );
    }

    const uploadedFiles: Array<{
      filename: string;
      path: string;
      mime?: string | null;
      size?: number | null;
    }> = [];

    for (const file of files) {
      if (!file.name) {
        return NextResponse.json(
          { error: "Uno dei file non ha un nome valido" },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File troppo grande: ${file.name}. Limite 15 MB.` },
          { status: 400 }
        );
      }

      const safeName = sanitizeFilename(file.name);
      const timestamp = Date.now();
      const path = `consults/${consultId}/messages/${messageId}/${timestamp}-${safeName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: storageError } = await admin.storage
        .from(CONSULT_MESSAGE_FILES_BUCKET)
        .upload(path, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (storageError) {
        return NextResponse.json(
          { error: `Upload fallito per ${file.name}: ${storageError.message}` },
          { status: 400 }
        );
      }

      uploadedFiles.push({
        filename: file.name,
        path,
        mime: file.type || "application/octet-stream",
        size: file.size,
      });
    }

    const saved = await createProfessionalConsultMessageFiles({
      consultId,
      messageId,
      files: uploadedFiles,
    });

    return NextResponse.json({
      ok: true,
      files: saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore upload allegati messaggio consulto",
      },
      { status: 400 }
    );
  }
}