import { NextRequest, NextResponse } from "next/server";
import { downloadPrivateFileBuffer } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase/server";

type ImagingOrthancMeta = {
  instance_id?: string | null;
  study_id?: string | null;
  series_id?: string | null;
  study_instance_uid?: string | null;
  series_instance_uid?: string | null;
  sop_instance_uid?: string | null;
  viewer_url?: string | null;
};

type ImagingFileStatus = "uploaded" | "processing" | "ready" | "failed";

type ImagingFileMeta = {
  id?: string | null;
  path?: string | null;
  name?: string | null;
  mime?: string | null;
  size?: number | null;
  status?: ImagingFileStatus | null;
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

type OrthancUploadResponse = {
  ID?: string;
  ParentStudy?: string;
  ParentSeries?: string;
};

type OrthancSimplifiedTagsResponse = {
  StudyInstanceUID?: string;
  SeriesInstanceUID?: string;
  SOPInstanceUID?: string;
};

type OrthancImportResult = {
  orthancInstanceId: string | null;
  orthancStudyId: string | null;
  orthancSeriesId: string | null;
  studyInstanceUID: string | null;
  seriesInstanceUID: string | null;
  sopInstanceUID: string | null;
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

function normalizeImagingFileStatus(file: ImagingFileMeta): ImagingFileStatus {
  const rawStatus = String(file?.status || "").trim().toLowerCase();

  if (
    rawStatus === "uploaded" ||
    rawStatus === "processing" ||
    rawStatus === "ready" ||
    rawStatus === "failed"
  ) {
    return rawStatus;
  }

  return "uploaded";
}

function getOrthancConfig() {
  const baseUrl = String(process.env.ORTHANC_BASE_URL || "").trim().replace(/\/+$/, "");
  const viewerBaseUrl = String(process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL || "").trim().replace(/\/+$/, "");
  const username = String(process.env.ORTHANC_USERNAME || "").trim();
  const password = String(process.env.ORTHANC_PASSWORD || "").trim();

  if (!baseUrl || !username || !password) {
    throw new Error("Orthanc non configurato. Verifica ORTHANC_BASE_URL, ORTHANC_USERNAME e ORTHANC_PASSWORD.");
  }

  return {
    baseUrl,
    viewerBaseUrl,
    username,
    password,
  };
}

function createOrthancBasicAuthHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function buildOhifViewerUrl(viewerBaseUrl: string, studyInstanceUid: string) {
  if (!viewerBaseUrl || !studyInstanceUid) {
    return null;
  }

  return `${viewerBaseUrl}/viewer?StudyInstanceUIDs=${encodeURIComponent(
    studyInstanceUid
  )}`;
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

async function importDicomFileToOrthanc(path: string): Promise<OrthancImportResult> {
  const { baseUrl, username, password } = getOrthancConfig();
  const authHeader = createOrthancBasicAuthHeader(username, password);

  const dicomBuffer = await downloadPrivateFileBuffer(path);
  const dicomBytes = new Uint8Array(dicomBuffer);

  const uploadResponse = await fetch(`${baseUrl}/instances`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/dicom",
      Accept: "application/json",
    },
    body: dicomBytes,
    cache: "no-store",
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`Errore import DICOM in Orthanc: ${uploadResponse.status} ${text}`);
  }

  const uploadJson = (await uploadResponse.json()) as OrthancUploadResponse;
  const orthancInstanceId = String(uploadJson.ID || "").trim() || null;
  const orthancStudyId = String(uploadJson.ParentStudy || "").trim() || null;
  const orthancSeriesId = String(uploadJson.ParentSeries || "").trim() || null;

  if (!orthancInstanceId) {
    throw new Error("Orthanc ha risposto senza ID istanza.");
  }

  const tags = await fetchOrthancSimplifiedTags(baseUrl, authHeader, orthancInstanceId);

  return {
    orthancInstanceId,
    orthancStudyId,
    orthancSeriesId,
    studyInstanceUID: String(tags.StudyInstanceUID || "").trim() || null,
    seriesInstanceUID: String(tags.SeriesInstanceUID || "").trim() || null,
    sopInstanceUID: String(tags.SOPInstanceUID || "").trim() || null,
  };
}

async function updateFileStatus(
  eventId: string,
  fileId: string,
  updater: (file: ImagingFileMeta) => ImagingFileMeta
) {
  const admin = supabaseAdmin();

  const { data: event, error } = await admin
    .from("animal_clinic_events")
    .select("id, meta")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    throw new Error("Evento imaging non trovato.");
  }

  const eventMeta = (event.meta || {}) as ClinicEventMeta;
  const imaging = eventMeta.imaging || {};
  const files = Array.isArray(imaging.files) ? imaging.files : [];

  const fileIndex = files.findIndex(
    (file) => String(file?.id || "").trim() === fileId
  );

  if (fileIndex < 0) {
    throw new Error("File imaging non trovato.");
  }

  const currentFile = files[fileIndex];
  const updatedFile = updater(currentFile);

  const updatedFiles = [...files];
  updatedFiles[fileIndex] = updatedFile;

  const updatedMeta: ClinicEventMeta = {
    ...eventMeta,
    imaging: {
      ...(imaging || {}),
      files: updatedFiles,
    },
  };

  const { error: updateError } = await admin
    .from("animal_clinic_events")
    .update({ meta: updatedMeta })
    .eq("id", eventId);

  if (updateError) {
    throw new Error(`Errore aggiornamento meta imaging: ${updateError.message}`);
  }

  return {
    eventMeta,
    imaging,
    files,
    fileIndex,
    currentFile,
    updatedFile,
  };
}

export async function POST(req: NextRequest) {
  const providedSecret = String(req.headers.get("x-imaging-ingest-secret") || "").trim();
  const expectedSecret = String(process.env.IMAGING_INGEST_SECRET || "").trim();

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let eventId = "";
  let fileId = "";

  try {
    const body = await req.json().catch(() => null) as
      | { eventId?: string; fileId?: string }
      | null;

    eventId = String(body?.eventId || "").trim();
    fileId = String(body?.fileId || "").trim();

    if (!eventId || !fileId) {
      return NextResponse.json(
        { error: "eventId o fileId mancanti" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    const { data: event, error: eventError } = await admin
      .from("animal_clinic_events")
      .select("id, meta")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Evento imaging non trovato" },
        { status: 404 }
      );
    }

    const eventMeta = (event.meta || {}) as ClinicEventMeta;
    const imaging = eventMeta.imaging || {};
    const files = Array.isArray(imaging.files) ? imaging.files : [];

    const fileIndex = files.findIndex(
      (file) => String(file?.id || "").trim() === fileId
    );

    if (fileIndex < 0) {
      return NextResponse.json(
        { error: "File imaging non trovato" },
        { status: 404 }
      );
    }

    const file = files[fileIndex];
    const status = normalizeImagingFileStatus(file);

    if (!isDicomFile(file)) {
      return NextResponse.json(
        { error: "Il file non è un DICOM." },
        { status: 400 }
      );
    }

    if (status === "ready") {
      return NextResponse.json({
        ok: true,
        status: "ready",
        alreadyReady: true,
      });
    }

    await updateFileStatus(eventId, fileId, (currentFile) => ({
      ...currentFile,
      status: "processing",
    }));

    const filePath = String(file?.path || "").trim();

    if (!filePath) {
      throw new Error("Percorso file imaging non disponibile.");
    }

    const orthancData = await importDicomFileToOrthanc(filePath);
    const viewerBaseUrl = String(process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL || "").trim().replace(/\/+$/, "");
    const viewerUrl = orthancData.studyInstanceUID && viewerBaseUrl
      ? buildOhifViewerUrl(viewerBaseUrl, orthancData.studyInstanceUID)
      : null;

    await updateFileStatus(eventId, fileId, (currentFile) => ({
      ...currentFile,
      status: "ready",
      orthanc: {
        ...(currentFile?.orthanc || {}),
        instance_id: orthancData.orthancInstanceId,
        study_id: orthancData.orthancStudyId,
        series_id: orthancData.orthancSeriesId,
        study_instance_uid: orthancData.studyInstanceUID,
        series_instance_uid: orthancData.seriesInstanceUID,
        sop_instance_uid: orthancData.sopInstanceUID,
        viewer_url: viewerUrl,
      },
    }));

    return NextResponse.json({
      ok: true,
      eventId,
      fileId,
      status: "ready",
      orthanc: {
        instance_id: orthancData.orthancInstanceId,
        study_id: orthancData.orthancStudyId,
        series_id: orthancData.orthancSeriesId,
        study_instance_uid: orthancData.studyInstanceUID,
        series_instance_uid: orthancData.seriesInstanceUID,
        sop_instance_uid: orthancData.sopInstanceUID,
        viewer_url: viewerUrl,
      },
    });
  } catch (err: unknown) {
    console.error("[IMAGING INGEST] Error", {
      eventId,
      fileId,
      error: err instanceof Error ? err.message : "Unknown error",
    });

    if (eventId && fileId) {
      try {
        await updateFileStatus(eventId, fileId, (currentFile) => ({
          ...currentFile,
          status: "failed",
        }));
      } catch (statusErr) {
        console.error("[IMAGING INGEST] Failed to set file status to failed", {
          eventId,
          fileId,
          error: statusErr instanceof Error ? statusErr.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(
      {
        error: "Errore ingest imaging",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}