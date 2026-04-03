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

function getImagingGatewayConfig() {
  const orthancBaseUrl = String(process.env.ORTHANC_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

  const viewerBaseUrl = String(
    process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL || ""
  )
    .trim()
    .replace(/\/+$/, "");

  const username = String(process.env.ORTHANC_USERNAME || "").trim();
  const password = String(process.env.ORTHANC_PASSWORD || "").trim();

  return {
    orthancBaseUrl,
    viewerBaseUrl,
    username,
    password,
  };
}

function createOptionalOrthancHeaders(username: string, password: string) {
  const headers: Record<string, string> = {};

  if (username && password) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  return headers;
}

function buildOhifViewerUrl(viewerBaseUrl: string, studyInstanceUid: string) {
  if (!viewerBaseUrl || !studyInstanceUid) {
    return null;
  }

  return `${viewerBaseUrl}/viewer?StudyInstanceUIDs=${encodeURIComponent(
    studyInstanceUid
  )}`;
}

async function orthancStudyExists(
  orthancBaseUrl: string,
  authHeaders: Record<string, string>,
  studyInstanceUid: string
): Promise<boolean> {
  const url =
    `${orthancBaseUrl}/dicom-web/studies?limit=1` +
    `&offset=0&fuzzymatching=false` +
    `&StudyInstanceUID=${encodeURIComponent(studyInstanceUid)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...authHeaders,
      Accept: "application/dicom+json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Errore verifica studio Orthanc: ${response.status} ${text}`);
  }

  const json = (await response.json().catch(() => null)) as unknown;

  return Array.isArray(json) && json.length > 0;
}

async function fetchOrthancSimplifiedTags(
  orthancBaseUrl: string,
  authHeaders: Record<string, string>,
  orthancInstanceId: string
): Promise<OrthancSimplifiedTagsResponse> {
  const response = await fetch(
    `${orthancBaseUrl}/instances/${encodeURIComponent(orthancInstanceId)}/simplified-tags`,
    {
      method: "GET",
      headers: {
        ...authHeaders,
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

function dicomViewError(message: string, status = 503) {
  return NextResponse.json(
    {
      error: message,
      code: "IMAGING_VIEW_NOT_READY",
    },
    { status }
  );
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
      f => String(f?.id || "").trim() === fileId
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

    const dicom = isDicomFile(file);

    if (!dicom) {
      const signedDownloadUrl = await createSignedDownloadUrl(filePath, 60);
      return NextResponse.redirect(signedDownloadUrl);
    }

    const { orthancBaseUrl, viewerBaseUrl, username, password } = getImagingGatewayConfig();

    console.log("[IMAGING VIEW] Config check", {
      orthancBaseUrl,
      viewerBaseUrl,
      username: username ? "***" : null,
      hasPassword: !!password,
    });

    if (!orthancBaseUrl || !viewerBaseUrl) {
      console.log("[IMAGING VIEW] Missing config for DICOM viewer");
      return dicomViewError("Viewer DICOM non configurato correttamente.", 500);
    }

    const authHeaders = createOptionalOrthancHeaders(username, password);

    const existingStudyInstanceUid = String(
      file?.orthanc?.study_instance_uid || ""
    ).trim();

    if (existingStudyInstanceUid) {
      console.log("[IMAGING VIEW] Checking existing study", {
        existingStudyInstanceUid,
        orthancBaseUrl,
        hasAuth: !!username && !!password,
      });

      const exists = await orthancStudyExists(
        orthancBaseUrl,
        authHeaders,
        existingStudyInstanceUid
      );

      console.log("[IMAGING VIEW] Study exists result", { exists });

      if (exists) {
        const viewerUrl = buildOhifViewerUrl(viewerBaseUrl, existingStudyInstanceUid);
        console.log("[IMAGING VIEW] Built viewer URL from existing study", { viewerUrl });

        if (viewerUrl) {
          return NextResponse.redirect(viewerUrl);
        }
      }
    }

    console.log("[IMAGING VIEW] Downloading DICOM from private storage", { filePath });

    const dicomBuffer = await downloadPrivateFileBuffer(filePath);
    const dicomBytes = new Uint8Array(dicomBuffer);

    console.log("[IMAGING VIEW] DICOM buffer size", {
      bufferSize: dicomBytes.length,
      filePath,
    });

    const uploadUrl = `${orthancBaseUrl}/instances`;

    console.log("[IMAGING VIEW] Starting Orthanc upload", {
      uploadUrl,
      bufferSize: dicomBytes.length,
      hasAuth: !!username && !!password,
    });

    const uploadResp = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/dicom",
        Accept: "application/json",
      },
      body: dicomBytes,
      cache: "no-store",
    });

    console.log("[IMAGING VIEW] Orthanc upload response", {
      status: uploadResp.status,
      statusText: uploadResp.statusText,
      ok: uploadResp.ok,
    });

    const uploadJson = (await uploadResp.json().catch(() => null)) as OrthancInstanceUploadResponse | null;

    console.log("[IMAGING VIEW] Upload JSON response", {
      uploadJson,
      hasId: !!uploadJson?.ID,
    });

    if (!uploadResp.ok || !uploadJson?.ID) {
      console.log("[IMAGING VIEW] Upload failed for DICOM", {
        uploadOk: uploadResp.ok,
        hasId: !!uploadJson?.ID,
        uploadStatus: uploadResp.status,
      });

      return dicomViewError(
        "Il file DICOM non è ancora pronto per il viewer oppure l'import in Orthanc è fallito."
      );
    }

    const orthancInstanceId = String(uploadJson.ID || "").trim() || null;
    const orthancStudyId = String(uploadJson.ParentStudy || "").trim() || null;
    const orthancSeriesId = String(uploadJson.ParentSeries || "").trim() || null;

    if (!orthancInstanceId) {
      console.log("[IMAGING VIEW] Missing instance ID for DICOM");
      return dicomViewError("Istanza DICOM non disponibile dopo l'import.");
    }

    console.log("[IMAGING VIEW] Fetching Orthanc tags", {
      orthancInstanceId,
      tagsUrl: `${orthancBaseUrl}/instances/${orthancInstanceId}/simplified-tags`,
    });

    const tags = await fetchOrthancSimplifiedTags(
      orthancBaseUrl,
      authHeaders,
      orthancInstanceId
    );

    console.log("[IMAGING VIEW] Tags response", {
      studyInstanceUid: tags.StudyInstanceUID,
      seriesInstanceUid: tags.SeriesInstanceUID,
      sopInstanceUid: tags.SOPInstanceUID,
    });

    const studyInstanceUid = String(tags.StudyInstanceUID || "").trim() || null;
    const seriesInstanceUid = String(tags.SeriesInstanceUID || "").trim() || null;
    const sopInstanceUid = String(tags.SOPInstanceUID || "").trim() || null;

    if (!studyInstanceUid) {
      console.log("[IMAGING VIEW] Missing StudyInstanceUID for DICOM");
      return dicomViewError("StudyInstanceUID non disponibile per questo file DICOM.");
    }

    const viewerUrl = buildOhifViewerUrl(viewerBaseUrl, studyInstanceUid);

    console.log("[IMAGING VIEW] Final viewer URL", { viewerUrl });

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
        viewer_url: viewerUrl,
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

    if (viewerUrl) {
      console.log("[IMAGING VIEW] Redirecting to viewer", { viewerUrl });
      return NextResponse.redirect(viewerUrl);
    }

    console.log("[IMAGING VIEW] Viewer URL missing after successful import");
    return dicomViewError("Viewer DICOM non disponibile dopo l'import.");
  } catch (err: unknown) {
    console.error("[IMAGING VIEW] Complete error details", {
      error: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
    });

    return NextResponse.json(
      {
        error: "Errore viewer",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}