import { NextResponse } from "next/server";
import { getCurrentUserFromRequestOrThrow } from "@/lib/server/getCurrentUserFromRequest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserFromRequestOrThrow(req);
    return NextResponse.json({ ok: true, user }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "UNAUTHORIZED" }, { status: 401 });
  }
}