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

export type ImagingJobStatus = "queued" | "processing" | "ready" | "failed";

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

type ImagingIngestJobRow = {
  id: string;
  event_id: string;
  file_id: string;
  animal_id: string;
  status: ImagingJobStatus;
  attempts: number | null;
  max_attempts: number | null;
  last_error: string | null;
  locked_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export type RunImagingIngestInput = {
  eventId: string;
  fileId: string;
  jobId?: string | null;
};

export type RunImagingIngestResult = {
  ok: true;
  eventId: string;
  fileId: string;
  jobId?: string | null;
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

export type RunQueuedImagingJobResult =
  | {
      ok: true;
      action: "processed";
      jobId: string;
      eventId: string;
      fileId: string;
      status: "ready" | "processing";
    }
  | {
      ok: true;
      action: "idle";
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
  const baseUrl = String(process.env.ORTHANC_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const viewerBaseUrl = String(process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const username = String(process.env.ORTHANC_USERNAME || "").trim();
  const password = String(process.env.ORTHANC_PASSWORD || "").trim();

  if (!baseUrl || !username || !password) {
    throw new Error(
      "Orthanc non configurato. Verifica ORTHANC_BASE_URL, ORTHANC_USERNAME e ORTHANC_PASSWORD."
    );
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
    `${orthancBaseUrl}/instances/${encodeURIComponent(
      orthancInstanceId
    )}/simplified-tags`,
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
    throw new Error(
      `Errore lettura simplified-tags Orthanc: ${response.status} ${text}`
    );
  }

  return (await response.json()) as OrthancSimplifiedTagsResponse;
}

async function orthancStudyExists(
  orthancBaseUrl: string,
  authHeader: string,
  studyInstanceUid: string
): Promise<boolean> {
  const url =
    `${orthancBaseUrl}/orthanc/dicom-web/studies?limit=1&offset=0&fuzzymatching=false` +
    `&StudyInstanceUID=${encodeURIComponent(studyInstanceUid)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authHeader,
      Accept: "application/dicom+json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Errore verifica studio Orthanc via QIDO: ${response.status} ${text}`
    );
  }

  const json = (await response.json().catch(() => null)) as unknown;
  return Array.isArray(json) && json.length > 0;
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
    throw new Error(
      `Errore import DICOM in Orthanc: ${uploadResponse.status} ${text}`
    );
  }

  const uploadJson = (await uploadResponse.json()) as OrthancUploadResponse;
  const orthancInstanceId = String(uploadJson.ID || "").trim() || null;
  const orthancStudyId = String(uploadJson.ParentStudy || "").trim() || null;
  const orthancSeriesId = String(uploadJson.ParentSeries || "").trim() || null;

  if (!orthancInstanceId) {
    throw new Error("Orthanc ha risposto senza ID istanza.");
  }

  const tags = await fetchOrthancSimplifiedTags(
    baseUrl,
    authHeader,
    orthancInstanceId
  );

  const studyInstanceUID = String(tags.StudyInstanceUID || "").trim() || null;
  const seriesInstanceUID = String(tags.SeriesInstanceUID || "").trim() || null;
  const sopInstanceUID = String(tags.SOPInstanceUID || "").trim() || null;

  if (!studyInstanceUID) {
    throw new Error("StudyInstanceUID mancante dopo import in Orthanc.");
  }

  const exists = await orthancStudyExists(baseUrl, authHeader, studyInstanceUID);

  if (!exists) {
    throw new Error(
      `Lo studio non risulta ancora disponibile via QIDO in Orthanc: ${studyInstanceUID}`
    );
  }

  return {
    orthancInstanceId,
    orthancStudyId,
    orthancSeriesId,
    studyInstanceUID,
    seriesInstanceUID,
    sopInstanceUID,
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
    file => String(file?.id || "").trim() === fileId
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

  const { eventMeta, imaging, files, fileIndex, file } = await loadImagingFile(
    eventId,
    fileId
  );

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

async function setImagingFileProcessing(eventId: string, fileId: string) {
  const updatedFile = await updateImagingFile(eventId, fileId, currentFile => ({
    ...currentFile,
    status: "processing",
  }));

  if (normalizeImagingFileStatus(updatedFile) !== "processing") {
    throw new Error("Impossibile impostare il file imaging in processing.");
  }

  return updatedFile;
}

async function setImagingFileReady(
  eventId: string,
  fileId: string,
  orthancData: OrthancImportResult,
  viewerUrl: string | null
) {
  await updateImagingFile(eventId, fileId, currentFile => ({
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

  const { file: verifiedFile } = await loadImagingFile(eventId, fileId);

  const finalStatus = normalizeImagingFileStatus(verifiedFile);
  const finalStudyUid =
    String(verifiedFile?.orthanc?.study_instance_uid || "").trim() || null;

  if (finalStatus !== "ready") {
    throw new Error("Meta imaging non aggiornato correttamente a ready.");
  }

  if (!finalStudyUid || finalStudyUid !== orthancData.studyInstanceUID) {
    throw new Error("Meta imaging non sincronizzato con StudyInstanceUID di Orthanc.");
  }

  return verifiedFile;
}

async function setImagingFileFailed(eventId: string, fileId: string) {
  await updateImagingFile(eventId, fileId, currentFile => ({
    ...currentFile,
    status: "failed",
  }));
}

async function getImagingJob(jobId: string) {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("imaging_ingest_jobs")
    .select(
      "id, event_id, file_id, animal_id, status, attempts, max_attempts, last_error, locked_at, started_at, finished_at"
    )
    .eq("id", jobId)
    .single<ImagingIngestJobRow>();

  if (error || !data) {
    throw new Error("Job ingest imaging non trovato.");
  }

  return data;
}

async function updateImagingJob(jobId: string, values: Record<string, unknown>) {
  const admin = supabaseAdmin();

  const { error } = await admin
    .from("imaging_ingest_jobs")
    .update(values)
    .eq("id", jobId);

  if (error) {
    throw new Error(`Errore aggiornamento job ingest imaging: ${error.message}`);
  }
}

async function markJobProcessing(jobId: string) {
  const now = new Date().toISOString();

  await updateImagingJob(jobId, {
    status: "processing",
    started_at: now,
    locked_at: now,
    last_error: null,
    finished_at: null,
  });
}

async function tryLockNextQueuedImagingJob(): Promise<ImagingIngestJobRow | null> {
  const admin = supabaseAdmin();

  const { data: candidate, error: candidateError } = await admin
    .from("imaging_ingest_jobs")
    .select(
      "id, event_id, file_id, animal_id, status, attempts, max_attempts, last_error, locked_at, started_at, finished_at"
    )
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ImagingIngestJobRow>();

  if (candidateError) {
    throw new Error(`Errore lettura coda ingest imaging: ${candidateError.message}`);
  }

  if (!candidate) {
    return null;
  }

  const now = new Date().toISOString();

  const { data: lockedRows, error: lockError } = await admin
    .from("imaging_ingest_jobs")
    .update({
      status: "processing",
      locked_at: now,
      started_at: now,
      last_error: null,
      finished_at: null,
    })
    .eq("id", candidate.id)
    .eq("status", "queued")
    .select(
      "id, event_id, file_id, animal_id, status, attempts, max_attempts, last_error, locked_at, started_at, finished_at"
    );

  if (lockError) {
    throw new Error(`Errore lock job ingest imaging: ${lockError.message}`);
  }

  const locked = Array.isArray(lockedRows)
    ? (lockedRows[0] as ImagingIngestJobRow | undefined)
    : undefined;

  return locked || null;
}

async function markJobReady(jobId: string) {
  const now = new Date().toISOString();

  await updateImagingJob(jobId, {
    status: "ready",
    finished_at: now,
    locked_at: null,
    last_error: null,
  });
}

async function markJobFailed(jobId: string, message: string) {
  const job = await getImagingJob(jobId);
  const attempts = Number(job.attempts || 0) + 1;
  const maxAttempts = Number(job.max_attempts || 3);
  const now = new Date().toISOString();

  if (attempts < maxAttempts) {
    await updateImagingJob(jobId, {
      status: "queued",
      attempts,
      last_error: message,
      locked_at: null,
      started_at: null,
      finished_at: null,
    });
    return;
  }

  await updateImagingJob(jobId, {
    status: "failed",
    attempts,
    last_error: message,
    locked_at: null,
    finished_at: now,
  });
}

export async function runImagingIngest(
  input: RunImagingIngestInput
): Promise<RunImagingIngestResult> {
  const eventId = String(input.eventId || "").trim();
  const fileId = String(input.fileId || "").trim();
  const jobId = String(input.jobId || "").trim() || null;

  if (!eventId || !fileId) {
    throw new Error("eventId o fileId mancanti.");
  }

  let readyCommitted = false;

  try {
    if (jobId) {
      await markJobProcessing(jobId);
    }

    const { file } = await loadImagingFile(eventId, fileId);

    if (!isDicomFile(file)) {
      throw new Error("Il file non è un DICOM.");
    }

    const currentStatus = normalizeImagingFileStatus(file);

    if (currentStatus === "ready") {
      const studyInstanceUid =
        String(file?.orthanc?.study_instance_uid || "").trim() || null;

      if (!studyInstanceUid) {
        throw new Error("File marcato ready ma senza StudyInstanceUID.");
      }

      const { baseUrl, username, password } = getOrthancConfig();
      const authHeader = createOrthancBasicAuthHeader(username, password);
      const exists = await orthancStudyExists(baseUrl, authHeader, studyInstanceUid);

      if (!exists) {
        throw new Error(
          `File marcato ready ma studio non disponibile in Orthanc: ${studyInstanceUid}`
        );
      }

      readyCommitted = true;

      if (jobId) {
        await markJobReady(jobId);
      }

      return {
        ok: true,
        eventId,
        fileId,
        jobId,
        status: "ready",
        alreadyReady: true,
        orthanc: {
          instance_id: String(file?.orthanc?.instance_id || "").trim() || null,
          study_id: String(file?.orthanc?.study_id || "").trim() || null,
          series_id: String(file?.orthanc?.series_id || "").trim() || null,
          study_instance_uid: studyInstanceUid,
          series_instance_uid:
            String(file?.orthanc?.series_instance_uid || "").trim() || null,
          sop_instance_uid:
            String(file?.orthanc?.sop_instance_uid || "").trim() || null,
          viewer_url: String(file?.orthanc?.viewer_url || "").trim() || null,
        },
      };
    }

    await setImagingFileProcessing(eventId, fileId);

    const filePath = String(file?.path || "").trim();

    if (!filePath) {
      throw new Error("Percorso file imaging non disponibile.");
    }

    const orthancData = await importDicomFileToOrthanc(filePath);
    const viewerBaseUrl = String(
      process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL || ""
    )
      .trim()
      .replace(/\/+$/, "");

    const viewerUrl =
      orthancData.studyInstanceUID && viewerBaseUrl
        ? buildOhifViewerUrl(viewerBaseUrl, orthancData.studyInstanceUID)
        : null;

    await setImagingFileReady(eventId, fileId, orthancData, viewerUrl);
    readyCommitted = true;

    if (jobId) {
      await markJobReady(jobId);
    }

    return {
      ok: true,
      eventId,
      fileId,
      jobId,
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
    const message = err instanceof Error ? err.message : "Unknown error";

    if (!readyCommitted) {
      try {
        await setImagingFileFailed(eventId, fileId);
      } catch (statusErr) {
        console.error("[IMAGING INGEST] Failed to set file status to failed", {
          eventId,
          fileId,
          error: statusErr instanceof Error ? statusErr.message : "Unknown error",
        });
      }
    }

    if (jobId) {
      await markJobFailed(jobId, message);
    }

    throw err;
  }
}

export async function runNextQueuedImagingIngestJob(): Promise<RunQueuedImagingJobResult> {
  const job = await tryLockNextQueuedImagingJob();

  if (!job) {
    return {
      ok: true,
      action: "idle",
    };
  }

  const result = await runImagingIngest({
    eventId: job.event_id,
    fileId: job.file_id,
    jobId: job.id,
  });

  return {
    ok: true,
    action: "processed",
    jobId: job.id,
    eventId: job.event_id,
    fileId: job.file_id,
    status: result.status,
  };
}