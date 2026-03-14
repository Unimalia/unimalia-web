import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error: "Endpoint disabilitato. Usa il flusso di claim tramite token.",
    },
    { status: 403 }
  );
}