import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

export async function GET(req: Request) {
  const token = getBearerToken(req);
  if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json({ error: "Server misconfigured (Supabase env missing)" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const fileId = (url.searchParams.get("fileId") || "").trim();
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

  const { data: fileRow, error: fErr } = await supabase
    .from("animal_clinic_event_files")
    .select("id, animal_id, path, filename")
    .eq("id", fileId)
    .single();

  if (fErr || !fileRow) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const animalId = (fileRow as any).animal_id as string;

  const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "read");
  if (!grant.ok) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      action: "file.download",
      target_type: "file",
      target_id: fileId,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });
    return NextResponse.json({ error: grant.reason }, { status: 403 });
  }

  const bucket = "clinic-event-files";
  const path = (fileRow as any).path as string;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "file.download",
      target_type: "file",
      target_id: fileId,
      animal_id: animalId,
      result: "error",
      reason: error?.message || "signed url failed",
    });
    return NextResponse.json({ error: "Impossibile generare link download." }, { status: 500 });
  }

  await writeAudit(supabase, {
    req,
    actor_user_id: user.id,
    actor_org_id: grant.actor_org_id,
    action: "file.download",
    target_type: "file",
    target_id: fileId,
    animal_id: animalId,
    result: "success",
  });

  return NextResponse.json({ ok: true, url: data.signedUrl, filename: (fileRow as any).filename }, { status: 200 });
}