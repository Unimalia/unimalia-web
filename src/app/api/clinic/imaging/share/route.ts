import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";
import { getBearerToken } from "@/lib/server/bearer";

async function resolveAuthenticatedUser(req: Request) {
  const token = getBearerToken(req);

  if (token) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      throw new Error("Server misconfigured (Supabase env missing)");
    }

    const { createClient } = await import("@supabase/supabase-js");

    const bearerSupabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const bearerUserResp = await bearerSupabase.auth.getUser(token);

    if (!bearerUserResp.error && bearerUserResp.data?.user) {
      return {
        supabase: bearerSupabase,
        user: bearerUserResp.data.user,
      };
    }
  }

  const cookieSupabase = await createServerSupabaseClient();
  const cookieUserResp = await cookieSupabase.auth.getUser();

  if (!cookieUserResp.error && cookieUserResp.data?.user) {
    return {
      supabase: cookieSupabase,
      user: cookieUserResp.data.user,
    };
  }

  return null;
}

function buildPublicBaseUrl(req: Request) {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";

  if (envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function generateShareToken() {
  return randomBytes(24).toString("base64url");
}

export async function POST(req: Request) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabase, user } = auth;
  const admin = supabaseAdmin();

  try {
    const body = await req.json().catch(() => ({}));

    const animalId = String(body?.animalId || "").trim();
    const eventId = String(body?.eventId || "").trim();
    const fileId = String(body?.fileId || "").trim();

    if (!animalId || !eventId || !fileId) {
      return NextResponse.json(
        { error: "animalId, eventId e fileId sono obbligatori." },
        { status: 400 }
      );
    }

    const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "read");

    if (!grant.ok) {
      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        action: "imaging.share.create",
        target_type: "event",
        target_id: eventId,
        animal_id: animalId,
        result: "denied",
        reason: grant.reason,
      });

      return NextResponse.json({ error: grant.reason }, { status: 403 });
    }

    const { data: eventRow, error: eventError } = await admin
      .from("animal_clinic_events")
      .select("id, animal_id, meta")
      .eq("id", eventId)
      .eq("animal_id", animalId)
      .single();

    if (eventError || !eventRow) {
      return NextResponse.json({ error: "Evento imaging non trovato." }, { status: 404 });
    }

    const files = eventRow?.meta?.imaging?.files;
    const file = Array.isArray(files) ? files.find((f: any) => String(f?.id) === fileId) : null;

    if (!file) {
      return NextResponse.json({ error: "File imaging non trovato nell'evento." }, { status: 404 });
    }

    const studyInstanceUid = String(file?.orthanc?.studyInstanceUid || "").trim();

    if (!studyInstanceUid) {
      return NextResponse.json(
        { error: "Viewer DICOM non disponibile per questo file." },
        { status: 400 }
      );
    }

    const token = generateShareToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await admin
      .from("imaging_share_links")
      .insert({
        token,
        animal_id: animalId,
        event_id: eventId,
        file_id: fileId,
        study_instance_uid: studyInstanceUid,
        access_type: "single_imaging_view",
        expires_at: expiresAt,
        created_by: user.id,
        meta: {
          filename: file?.name || null,
          mime: file?.mime || null,
          orthancStudyId: file?.orthanc?.studyId || null,
          orthancSeriesId: file?.orthanc?.seriesId || null,
          orthancInstanceId: file?.orthanc?.instanceId || null,
        },
      });

    if (insertError) {
      throw new Error(`Errore creazione imaging share link: ${insertError.message}`);
    }

    const appBaseUrl = buildPublicBaseUrl(req);
    const shareUrl = `${appBaseUrl}/imaging/shared/${token}`;

    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "imaging.share.create",
      target_type: "event",
      target_id: eventId,
      animal_id: animalId,
      result: "success",
      diff: {
        fileId,
        token,
        expiresAt,
        accessType: "single_imaging_view",
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        token,
        shareUrl,
        expiresAt,
        accessType: "single_imaging_view",
      },
    });
  } catch (err: any) {
    console.error("IMAGING SHARE CREATE ERROR:", err);

    return NextResponse.json(
      {
        error: "Errore creazione link imaging",
        details: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}