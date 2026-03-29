import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getBearerToken } from "@/lib/server/bearer";

type MarkPartBody = {
  uploadId?: string;
  partNumber?: number;
};

type UploadSessionRow = {
  uploaded_parts: number[] | null;
};

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const admin = supabaseAdmin();

    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uploadId, partNumber } = (await req.json()) as MarkPartBody;

    if (!uploadId || !partNumber) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const { data: session } = await admin
      .from("clinic_imaging_upload_sessions")
      .select("uploaded_parts")
      .eq("upload_id", uploadId)
      .single<UploadSessionRow>();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const existing = Array.isArray(session.uploaded_parts)
      ? session.uploaded_parts
      : [];

    const updated = Array.from(new Set([...existing, partNumber]));

    const { error } = await admin
      .from("clinic_imaging_upload_sessions")
      .update({
        uploaded_parts: updated,
        status: "uploading",
        updated_at: new Date().toISOString(),
      })
      .eq("upload_id", uploadId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, uploadedParts: updated });
  } catch (err: unknown) {
    console.error("MARK PART ERROR:", err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error mark-part" },
      { status: 500 }
    );
  }
}