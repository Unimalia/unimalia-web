import { NextRequest, NextResponse } from "next/server";
import { runImagingIngest } from "@/lib/imaging/ingest";

export async function POST(req: NextRequest) {
  const providedSecret = String(req.headers.get("x-imaging-ingest-secret") || "").trim();
  const expectedSecret = String(process.env.IMAGING_INGEST_SECRET || "").trim();

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null) as
      | { eventId?: string; fileId?: string; jobId?: string }
      | null;

    const eventId = String(body?.eventId || "").trim();
    const fileId = String(body?.fileId || "").trim();
    const jobId = String(body?.jobId || "").trim() || null;

    if (!eventId || !fileId) {
      return NextResponse.json(
        { error: "eventId o fileId mancanti" },
        { status: 400 }
      );
    }

    const result = await runImagingIngest({
      eventId,
      fileId,
      jobId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[IMAGING INGEST ROUTE] Error", {
      error: err instanceof Error ? err.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Errore ingest imaging",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
