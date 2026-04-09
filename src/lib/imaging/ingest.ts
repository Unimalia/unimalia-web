import { downloadPrivateFileBuffer } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase/server";

export type ImagingOrthancMeta = {
  instance_id?: string | null;
  study_id?: string | null;
  series_id?: string | null;
  study_instance_uid?: string | null;
  series_instance_uid?: string | null;
  sop_instance_uid?: string | null;
  viewer_url?: string | null;
};

export type ImagingFileStatus = "uploaded" | "processing" | "ready" | "failed";

export type ImagingFileMeta = {
  id?: string | null;
  path?: string | null;
  name?: string | null;
  mime?: string | null;
  size?: number | null;
  status?: ImagingFileStatus | null;
  orthanc?: ImagingOrthancMeta | null;
};

export type ClinicEventMeta = {
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

export type RunImagingIngestInput = {
  eventId: string;
  fileId: string;
};

export type RunImagingIngestResult = {
  ok: true;
  eventId: string;
  fileId: string;
  status: "ready" | "processing";
  alreadyReady?: boolean;
  alreadyProcessing?: boolean;
  orthanc?: {
    instance_id: string | null;
    study_id: string | null;
    series_id: string | null;
    study_instance_uid: string | null;
    series_instance_uid: string | null;
    sop_instance_uid: string | null;
    viewer_url: string | null;
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

async function loadImagingFile(eventId: string, fileId: string) {
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

  const file = files[fileIndex];

  return {
    eventMeta,
    imaging,
    files,
    fileIndex,
    file,
  };
}

async function updateImagingFile(
  eventId: string,
  fileId: string,
  updater: (file: ImagingFileMeta) => ImagingFileMeta
) {
  const admin = supabaseAdmin();

  const { eventMeta, imaging, files, fileIndex, file } = await loadImagingFile(eventId, fileId);

  const updatedFile = updater(file);
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

  return updatedFile;
}

export async function runImagingIngest(
  input: RunImagingIngestInput
): Promise<RunImagingIngestResult> {
  const eventId = String(input.eventId || "").trim();
  const fileId = String(input.fileId || "").trim();

  if (!eventId || !fileId) {
    throw new Error("eventId o fileId mancanti.");
  }

  try {
    const { file } = await loadImagingFile(eventId, fileId);

    if (!isDicomFile(file)) {
      throw new Error("Il file non è un DICOM.");
    }

    const currentStatus = normalizeImagingFileStatus(file);

    if (currentStatus === "ready") {
      return {
        ok: true,
        eventId,
        fileId,
        status: "ready",
        alreadyReady: true,
        orthanc: {
          instance_id: String(file?.orthanc?.instance_id || "").trim() || null,
          study_id: String(file?.orthanc?.study_id || "").trim() || null,
          series_id: String(file?.orthanc?.series_id || "").trim() || null,
          study_instance_uid: String(file?.orthanc?.study_instance_uid || "").trim() || null,
          series_instance_uid: String(file?.orthanc?.series_instance_uid || "").trim() || null,
          sop_instance_uid: String(file?.orthanc?.sop_instance_uid || "").trim() || null,
          viewer_url: String(file?.orthanc?.viewer_url || "").trim() || null,
        },
      };
    }

    if (currentStatus === "processing") {
      return {
        ok: true,
        eventId,
        fileId,
        status: "processing",
        alreadyProcessing: true,
      };
    }

    const filePath = String(file?.path || "").trim();

    if (!filePath) {
      throw new Error("Percorso file imaging non disponibile.");
    }

    await updateImagingFile(eventId, fileId, (currentFile) => ({
      ...currentFile,
      status: "processing",
    }));

    const orthancData = await importDicomFileToOrthanc(filePath);
    const viewerBaseUrl = String(process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL || "").trim().replace(/\/+$/, "");
    const viewerUrl = orthancData.studyInstanceUID && viewerBaseUrl
      ? buildOhifViewerUrl(viewerBaseUrl, orthancData.studyInstanceUID)
      : null;

    await updateImagingFile(eventId, fileId, (currentFile) => ({
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

    return {
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
    };
  } catch (err) {
    try {
      await updateImagingFile(eventId, fileId, (currentFile) => ({
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

    throw err;
  }
}