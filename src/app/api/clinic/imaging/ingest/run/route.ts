import { NextRequest, NextResponse } from "next/server";
import { runNextQueuedImagingIngestJob } from "@/lib/imaging/ingest";

export async function POST(req: NextRequest) {
  const providedSecret = String(req.headers.get("x-imaging-ingest-secret") || "").trim();
  const expectedSecret = String(process.env.IMAGING_INGEST_SECRET || "").trim();

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runNextQueuedImagingIngestJob();
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[IMAGING INGEST RUNNER ROUTE] Error", {
      error: err instanceof Error ? err.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Errore runner ingest imaging",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}