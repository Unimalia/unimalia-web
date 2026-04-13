import { NextResponse } from "next/server";
import { getCurrentUserFromBearerOrThrow } from "@/lib/server/auth";
import { isVetinfoConfigured } from "@/lib/vetinfo/config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserFromBearerOrThrow(req);

    return NextResponse.json(
      {
        ok: true,
        configured: isVetinfoConfigured(),
        status: isVetinfoConfigured() ? "not_connected" : "not_configured",
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  }
}