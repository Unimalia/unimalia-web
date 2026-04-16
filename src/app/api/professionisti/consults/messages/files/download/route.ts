import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getCurrentProfessionalContext } from "@/lib/professionisti/consults";

const CONSULT_MESSAGE_FILES_BUCKET = "professional-consults";

export async function GET(req: NextRequest) {
  try {
    const admin = supabaseAdmin();
    const ctx = await getCurrentProfessionalContext();

    const { searchParams } = new URL(req.url);
    const path = String(searchParams.get("path") || "").trim();
    const filenameParam = String(searchParams.get("filename") || "").trim();

    if (!path) {
      return NextResponse.json({ error: "Path mancante" }, { status: 400 });
    }

    const { data: fileRow, error: fileRowError } = await admin
      .from("professional_consult_message_files")
      .select("id,consult_id,filename,path,mime,size")
      .eq("path", path)
      .maybeSingle();

    if (fileRowError) {
      return NextResponse.json({ error: fileRowError.message }, { status: 400 });
    }

    if (!fileRow) {
      return NextResponse.json({ error: "File non trovato" }, { status: 404 });
    }

    const { data: consult, error: consultError } = await admin
      .from("professional_consult_requests")
      .select("id,sender_professional_id,receiver_professional_id")
      .eq("id", fileRow.consult_id)
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

    const { data: downloaded, error: downloadError } = await admin.storage
      .from(CONSULT_MESSAGE_FILES_BUCKET)
      .download(path);

    if (downloadError || !downloaded) {
      return NextResponse.json(
        { error: downloadError?.message || "Errore download file" },
        { status: 400 }
      );
    }

    const contentType = fileRow.mime || "application/octet-stream";
    const filename = filenameParam || fileRow.filename || "allegato";

    const arrayBuffer = await downloaded.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Errore download allegato messaggio",
      },
      { status: 400 }
    );
  }
}
