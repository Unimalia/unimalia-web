import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    Sentry.setTag("area", "public");
    Sentry.setTag("flow", "example");

    // tua logica
    return NextResponse.json({ ok: true });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        area: "public",
        flow: "example",
      },
    });

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}