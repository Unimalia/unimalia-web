import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSignedDownloadUrl, downloadPrivateFileBuffer } from "@/lib/storage";
import { supabaseAdmin, createServerSupabaseClient } from "@/lib/supabase/server";
import { getBearerToken } from "@/lib/server/bearer";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";

type ImagingOrthancMeta = {
  instance_id?: string | null;
  study_id?: string | null;
  series_id?: string | null;
  study_instance_uid?: string | null;
  series_instance_uid?: string | null;
  sop_instance_uid?: string | null;
  viewer_url?: string | null;
};

type ImagingFileMeta = {
  id?: string | null;
  path?: string | null;
  name?: string | null;
  mime?: string | null;
  size?: number | null;
  orthanc?: ImagingOrthancMeta | null;
};

type ClinicEventMeta = {
  imaging?: {
    modality?: string | null;
    body_part?: string | null;
    files?: ImagingFileMeta[] | null;
  } | null;
  [key: string]: unknown;
};

type OrthancInstanceUploadResponse = {
  ID?: string;
  ParentStudy?: string;
  ParentSeries?: string;
};

type OrthancSimplifiedTagsResponse = {
  StudyInstanceUID?: string | null;
  SeriesInstanceUID?: string | null;
  SOPInstanceUID?: string | null;
};

type ProfessionalProfileRoleRow = {
  role: string | null;
};

type AuthenticatedUserResult = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: {
    id: string;
    email?: string | null;
  };
};

function isDicomFile(file: ImagingFileMeta) {
  const mime = String(file?.mime || "").toLowerCase().trim();
  const name = String(file?.name || "").toLowerCase().trim();

  return (
    mime === "application/dicom" ||
    name.endsWith(".dcm") ||
    name.endsWith(".dicom")
  );
}

async function getProfessionalRole(userId: string) {
  const admin = supabaseAdmin();

  const result = await admin
    .from("professional_profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle<ProfessionalProfileRoleRow>();

  if (result.error) {
    throw result.error;
  }

  return String(result.data?.role || "").trim() || null;
}

async function resolveAuthenticatedUser(req: Request): Promise<AuthenticatedUserResult | null> {
  const token = getBearerToken(req);

  if (token) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      throw new Error("Server misconfigured (Supabase env missing)");
    }

    const bearerSupabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const bearerUserResp = await bearerSupabase.auth.getUser(token);

    if (!bearerUserResp.error && bearerUserResp.data?.user) {
      return {
        supabase: bearerSupabase as Awaited<ReturnType<typeof createServerSupabaseClient>>,
        user: bearerUserResp.data.user,
      };
    }

    console.error("[IMAGING VIEW AUTH] bearer failed", {
      hasToken: true,
      error: bearerUserResp.error?.message ?? null,
    });
  }

  const cookieSupabase = await createServerSupabaseClient();
  const cookieUserResp = await cookieSupabase.auth.getUser();

  if (!cookieUserResp.error && cookieUserResp.data?.user) {
    return {
      supabase: cookieSupabase,
      user: cookieUserResp.data.user,
    };
  }

  console.error("[IMAGING VIEW AUTH] cookie failed", {
    error: cookieUserResp.error?.message ?? null,
  });

  return null;
}

function getOrthancConfig() {
  const orthancBaseUrl = (process.env.ORTHANC_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const username = (process.env.ORTHANC_USERNAME || "").trim();
  const password = (process.env.ORTHANC_PASSWORD || "").trim();

  return {
    orthancBaseUrl,
    username,
    password,
  };
}

function createOrthancBasicAuthHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

async function fetchOrthancSimplifiedTags(
  orthancBaseUrl: string,
  authHeader: string,
  orthancInstanceId: string
): Promise<OrthancSimplifiedTagsResponse> {
  const response = await fetch(
    `${orthancBaseUrl}/instances/${encodeURIComponent(orthancInstanceId)}/simplified-tags`,
    {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Errore lettura simplified-tags Orthanc: ${response.status} ${text}`);
  }

  return (await response.json()) as OrthancSimplifiedTagsResponse;
}

function buildStoneViewerUrl(studyInstanceUid: string) {
  const orthancPublicBase = (process.env.ORTHANC_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

  if (!orthancPublicBase) {
    return null;
  }

  return `${orthancPublicBase}/stone-webviewer/index.html?study=${encodeURIComponent(
    studyInstanceUid
  )}`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthenticatedUser(req);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { supabase, user } = auth;

    const professionalRole = await getProfessionalRole(user.id);

    if (professionalRole && professionalRole !== "veterinarian") {
      return NextResponse.json(
        { error: "Accesso clinico riservato ai veterinari." },
        { status: 403 }
      );
    }

    const eventId = req.nextUrl.searchParams.get("eventId")?.trim();
    const fileId = req.nextUrl.searchParams.get("fileId")?.trim();

    if (!eventId || !fileId) {
      return NextResponse.json(
        { error: "eventId o fileId mancanti" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    const { data: event, error: eventError } = await admin
      .from("animal_clinic_events")
      .select("id, animal_id, meta")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Evento imaging non trovato" },
        { status: 404 }
      );
    }

    const animalId = String(event.animal_id || "").trim();

    const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "read");

    if (!grant.ok) {
      return NextResponse.json({ error: grant.reason }, { status: 403 });
    }

    const eventMeta = (event.meta || {}) as ClinicEventMeta;
    const imaging = eventMeta.imaging || {};
    const files = Array.isArray(imaging.files) ? imaging.files : [];

    const fileIndex = files.findIndex(
      (f) => String(f?.id || "").trim() === fileId
    );

    if (fileIndex < 0) {
      return NextResponse.json(
        { error: "File imaging non trovato" },
        { status: 404 }
      );
    }

    const file = files[fileIndex];
    const filePath = String(file?.path || "").trim();

    if (!filePath) {
      return NextResponse.json(
        { error: "Percorso file imaging non disponibile" },
        { status: 400 }
      );
    }

    if (!isDicomFile(file)) {
      const signedDownloadUrl = await createSignedDownloadUrl(filePath, 60);
      return NextResponse.redirect(signedDownloadUrl);
    }

    const existingStudyInstanceUid = String(
      file?.orthanc?.study_instance_uid || ""
    ).trim();

    if (existingStudyInstanceUid) {
      const stoneUrl = buildStoneViewerUrl(existingStudyInstanceUid);

      if (stoneUrl) {
        return NextResponse.redirect(stoneUrl);
      }
    }

    const { orthancBaseUrl, username, password } = getOrthancConfig();

    if (!orthancBaseUrl || !username || !password) {
      const signedDownloadUrl = await createSignedDownloadUrl(filePath, 60);
      return NextResponse.redirect(signedDownloadUrl);
    }

    const authHeader = createOrthancBasicAuthHeader(username, password);

    const dicomBuffer = await downloadPrivateFileBuffer(filePath);
    const dicomBytes = new Uint8Array(dicomBuffer);

    const uploadResp = await fetch(`${orthancBaseUrl}/instances`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/dicom",
        Accept: "application/json",
      },
      body: dicomBytes,
      cache: "no-store",
    });

    const uploadJson = (await uploadResp.json().catch(() => null)) as OrthancInstanceUploadResponse | null;

    if (!uploadResp.ok || !uploadJson?.ID) {
      const signedDownloadUrl = await createSignedDownloadUrl(filePath, 60);
      return NextResponse.redirect(signedDownloadUrl);
    }

    const orthancInstanceId = String(uploadJson.ID || "").trim() || null;
    const orthancStudyId = String(uploadJson.ParentStudy || "").trim() || null;
    const orthancSeriesId = String(uploadJson.ParentSeries || "").trim() || null;

    if (!orthancInstanceId) {
      const signedDownloadUrl = await createSignedDownloadUrl(filePath, 60);
      return NextResponse.redirect(signedDownloadUrl);
    }

    const tags = await fetchOrthancSimplifiedTags(
      orthancBaseUrl,
      authHeader,
      orthancInstanceId
    );

    const studyInstanceUid = String(tags.StudyInstanceUID || "").trim() || null;
    const seriesInstanceUid = String(tags.SeriesInstanceUID || "").trim() || null;
    const sopInstanceUid = String(tags.SOPInstanceUID || "").trim() || null;

    if (!studyInstanceUid) {
      const signedDownloadUrl = await createSignedDownloadUrl(filePath, 60);
      return NextResponse.redirect(signedDownloadUrl);
    }

    const stoneUrl = buildStoneViewerUrl(studyInstanceUid);

    const updatedFile: ImagingFileMeta = {
      ...file,
      orthanc: {
        ...(file?.orthanc || {}),
        instance_id: orthancInstanceId,
        study_id: orthancStudyId,
        series_id: orthancSeriesId,
        study_instance_uid: studyInstanceUid,
        series_instance_uid: seriesInstanceUid,
        sop_instance_uid: sopInstanceUid,
        viewer_url: stoneUrl,
      },
    };

    const updatedFiles = [...files];
    updatedFiles[fileIndex] = updatedFile;

    const updatedMeta: ClinicEventMeta = {
      ...eventMeta,
      imaging: {
        ...(imaging || {}),
        files: updatedFiles,
      },
    };

    await admin
      .from("animal_clinic_events")
      .update({ meta: updatedMeta })
      .eq("id", eventId);

    if (stoneUrl) {
      return NextResponse.redirect(stoneUrl);
    }

    const signedDownloadUrl = await createSignedDownloadUrl(filePath, 60);
    return NextResponse.redirect(signedDownloadUrl);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Errore viewer",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}