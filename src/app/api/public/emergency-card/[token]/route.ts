import { NextResponse } from "next/server";
import { getPublicEmergencyCardByToken } from "@/lib/emergency/public-card";
import {
  insertEmergencyAccessLog,
  resolveEmergencyToken,
} from "@/lib/emergency/repository";
import { isEmergencyTokenFormatValid } from "@/lib/emergency/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
};

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  const ms = new Date(expiresAt).getTime();
  if (Number.isNaN(ms)) return false;
  return ms <= Date.now();
}

export async function GET(req: Request, context: RouteContext) {
  const { token } = await context.params;
  const safeToken = String(token ?? "").trim();

  const requestPath = new URL(req.url).pathname;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent");
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;
  const requestId = req.headers.get("x-request-id");

  if (!safeToken || !isEmergencyTokenFormatValid(safeToken)) {
    return NextResponse.json(
      { error: "Token non valido o non attivo" },
      {
        status: 404,
        headers: NO_STORE_HEADERS,
      }
    );
  }

  const resolved = await resolveEmergencyToken(safeToken);

  if (!resolved.row) {
    await insertEmergencyAccessLog({
      tokenHash: resolved.tokenHash,
      animalId: null,
      requestPath,
      ip,
      userAgent,
      country,
      outcome: "token_not_found",
      servedView: null,
      requestId,
    });

    return NextResponse.json(
      { error: "Token non valido o non attivo" },
      {
        status: 404,
        headers: NO_STORE_HEADERS,
      }
    );
  }

  if (resolved.row.status !== "active" || isExpired(resolved.row.expires_at)) {
    await insertEmergencyAccessLog({
      tokenHash: resolved.tokenHash,
      animalId: resolved.row.animal_id,
      requestPath,
      ip,
      userAgent,
      country,
      outcome: "token_inactive",
      servedView: null,
      requestId,
    });

    return NextResponse.json(
      { error: "Token non valido o non attivo" },
      {
        status: 404,
        headers: NO_STORE_HEADERS,
      }
    );
  }

  const payload = await getPublicEmergencyCardByToken(safeToken, {
    requestPath,
    ip,
    userAgent,
    country,
    requestId,
  });

  if (!payload) {
    await insertEmergencyAccessLog({
      tokenHash: resolved.tokenHash,
      animalId: resolved.row.animal_id,
      requestPath,
      ip,
      userAgent,
      country,
      outcome: "animal_missing",
      servedView: null,
      requestId,
    });

    return NextResponse.json(
      { error: "Scheda emergenza non disponibile" },
      {
        status: 404,
        headers: NO_STORE_HEADERS,
      }
    );
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}