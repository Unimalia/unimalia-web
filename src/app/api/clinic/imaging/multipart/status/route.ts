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

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId obbligatorio." },
        { status: 400 }
      );
    }

    const { data: session, error: sessionErr } = await admin
      .from("clinic_imaging_upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json(
        { error: "Upload session non trovata." },
        { status: 404 }
      );
    }

    if (String(session.created_by) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const totalParts = Number(session.total_parts || 0);
    const fileSize = Number(session.file_size || 0);

    const uploadedPartsRaw = Array.isArray(session.uploaded_parts)
      ? session.uploaded_parts
      : [];

    const normalizedParts = uploadedPartsRaw.filter(
      (p: any) =>
        p &&
        Number.isInteger(Number(p.PartNumber)) &&
        Number(p.PartNumber) > 0 &&
        typeof p.ETag === "string"
    );

    const uploadedPartNumbers = normalizedParts.map((p: any) =>
      Number(p.PartNumber)
    );

    const uploadedBytes = normalizedParts.reduce(
      (sum: number, p: any) => sum + Number(p?.size || 0),
      0
    );

    const percent =
      fileSize > 0 ? Math.min(100, Math.round((uploadedBytes / fileSize) * 100)) : 0;

    const remainingParts = [];
    for (let i = 1; i <= totalParts; i++) {
      if (!uploadedPartNumbers.includes(i)) {
        remainingParts.push(i);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        sessionId,
        status: session.status,
        fileName: session.file_name,
        fileSize,
        totalParts,
        uploadedParts: normalizedParts,
        uploadedPartNumbers,
        uploadedPartsCount: normalizedParts.length,
        remainingParts,
        uploadedBytes,
        percent,
      },
    });
  } catch (err: any) {
    console.error("IMAGING MULTIPART STATUS ERROR:", err);

    return NextResponse.json(
      {
        error: err?.message || "Status error",
      },
      { status: 500 }
    );
  }
}