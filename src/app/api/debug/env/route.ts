import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    node: process.version,
    time: new Date().toISOString(),
  });
}