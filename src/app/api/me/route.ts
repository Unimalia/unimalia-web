import { NextResponse } from "next/server";
import { getCurrentUserFromBearerOrThrow } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserFromBearerOrThrow(req);
    return NextResponse.json({ ok: true, user }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "UNAUTHORIZED" }, { status: 401 });
  }
}