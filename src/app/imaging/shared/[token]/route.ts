import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

function getOrthancPublicBaseUrl() {
  const value =
    process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL ||
    process.env.ORTHANC_PUBLIC_URL ||
    "";

  return value.trim().replace(/\/+$/, "");
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const cleanToken = String(token || "").trim();

  if (!cleanToken) {
    return NextResponse.json({ error: "Token mancante" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: linkRow, error } = await admin
    .from("imaging_share_links")
    .select("*")
    .eq("token", cleanToken)
    .single();

  if (error || !linkRow) {
    return NextResponse.json({ error: "Link non valido" }, { status: 404 });
  }

  if (linkRow.revoked_at) {
    return NextResponse.json({ error: "Link revocato" }, { status: 410 });
  }

  const now = Date.now();
  const expiresAt = new Date(linkRow.expires_at).getTime();

  if (!Number.isFinite(expiresAt) || expiresAt < now) {
    return NextResponse.json({ error: "Link scaduto" }, { status: 410 });
  }

  const studyInstanceUid = String(linkRow.study_instance_uid || "").trim();
  if (!studyInstanceUid) {
    return NextResponse.json({ error: "StudyInstanceUID mancante" }, { status: 400 });
  }

  const orthancPublicBaseUrl = getOrthancPublicBaseUrl();
  if (!orthancPublicBaseUrl) {
    return NextResponse.json(
      { error: "ORTHANC public URL non configurato" },
      { status: 500 }
    );
  }

  await admin
    .from("imaging_share_links")
    .update({
      used_count: Number(linkRow.used_count || 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", linkRow.id);

  const redirectUrl = `${orthancPublicBaseUrl}/ohif/viewer?StudyInstanceUIDs=${encodeURIComponent(
    studyInstanceUid
  )}`;

  return NextResponse.redirect(redirectUrl);
}