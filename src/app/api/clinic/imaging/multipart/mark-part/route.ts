import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json(
        { error: "Server misconfigured (Supabase env missing)" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const admin = supabaseAdmin();

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const user = userData?.user;

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    const sessionId = String(body?.sessionId || "").trim();
    const partNumber = Number(body?.partNumber);
    const etag = String(body?.etag || "").trim();
    const size = Number(body?.size);

    if (!sessionId || !Number.isInteger(partNumber) || partNumber <= 0 || !etag) {
      return NextResponse.json(
        { error: "sessionId, partNumber ed etag sono obbligatori." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json(
        { error: "size non valido." },
        { status: 400 }
      );
    }

    const { data: session, error: sessionErr } = await admin
      .from("clinic_imaging_upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Upload session non trovata." }, { status: 404 });
    }

    if (String(session.created_by) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.status === "completed") {
      return NextResponse.json(
        { error: "Upload session già completata." },
        { status: 400 }
      );
    }

    if (session.status === "aborted") {
      return NextResponse.json(
        { error: "Upload session annullata." },
        { status: 400 }
      );
    }

    const totalParts = Number(session.total_parts || 0);
    if (!Number.isInteger(totalParts) || totalParts <= 0) {
      return NextResponse.json(
        { error: "Upload session non valida: total_parts mancante." },
        { status: 500 }
      );
    }

    if (partNumber > totalParts) {
      return NextResponse.json(
        { error: `partNumber fuori range. Max consentito: ${totalParts}.` },
        { status: 400 }
      );
    }

    const uploadedPartsRaw = Array.isArray(session.uploaded_parts) ? session.uploaded_parts : [];

    const normalizedParts = uploadedPartsRaw.filter(
      (p: any) =>
        p &&
        Number.isInteger(Number(p.PartNumber)) &&
        Number(p.PartNumber) > 0 &&
        typeof p.ETag === "string" &&
        p.ETag.trim().length > 0
    );

    const existingIndex = normalizedParts.findIndex(
      (p: any) => Number(p.PartNumber) === partNumber
    );

    const nextPart = {
      PartNumber: partNumber,
      ETag: etag.replaceAll('"', ""),
      size,
      uploadedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      normalizedParts[existingIndex] = nextPart;
    } else {
      normalizedParts.push(nextPart);
    }

    normalizedParts.sort((a: any, b: any) => Number(a.PartNumber) - Number(b.PartNumber));

    const nextStatus =
      normalizedParts.length >= totalParts ? "uploading" : "uploading";

    const { error: updateErr } = await admin
      .from("clinic_imaging_upload_sessions")
      .update({
        uploaded_parts: normalizedParts,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const uploadedBytes = normalizedParts.reduce(
      (sum: number, p: any) => sum + Number(p?.size || 0),
      0
    );

    const fileSize = Number(session.file_size || 0);
    const percent =
      fileSize > 0 ? Math.min(100, Math.round((uploadedBytes / fileSize) * 100)) : 0;

    return NextResponse.json({
      ok: true,
      data: {
        sessionId,
        partNumber,
        uploadedPartsCount: normalizedParts.length,
        totalParts,
        uploadedBytes,
        fileSize,
        percent,
      },
    });
  } catch (err: any) {
    console.error("IMAGING MULTIPART MARK-PART ERROR:", err);

    return NextResponse.json(
      {
        error: err?.message || "Mark part error",
      },
      { status: 500 }
    );
  }
}