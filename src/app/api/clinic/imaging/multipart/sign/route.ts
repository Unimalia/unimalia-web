import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createSignedUploadUrl } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, partNumber } = body;

    if (!sessionId || !partNumber) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: session, error } = await admin
      .from("clinic_imaging_upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const path = `${session.storage_key}.part${partNumber}`;

    const signed = await createSignedUploadUrl({
      path,
      contentType: "application/octet-stream",
      expiresInSeconds: 60 * 15,
    });

    return NextResponse.json({
      ok: true,
      data: {
        url: signed.url,
        path,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Sign error" },
      { status: 500 }
    );
  }
}