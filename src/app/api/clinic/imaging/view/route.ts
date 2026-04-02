import { NextRequest, NextResponse } from "next/server";
import { createSignedDownloadUrl } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase/server";

type ImagingOrthancMeta = {
  patientId?: string | null;
  studyId?: string | null;
  seriesId?: string | null;
  instanceId?: string | null;
  studyInstanceUid?: string | null;
  seriesInstanceUid?: string | null;
  sopInstanceUid?: string | null;
  ohifStudyListUrl?: string | null;
  orthancExplorerUrl?: string | null;
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
  ParentPatient?: string;
};

type OrthancStudyResponse = {
  MainDicomTags?: {
    StudyInstanceUID?: string | null;
  } | null;
};

export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId")?.trim();
    const fileId = req.nextUrl.searchParams.get("fileId")?.trim();

    if (!eventId || !fileId) {
      return NextResponse.json(
        { error: "eventId o fileId mancanti" },
        { status: 400 }
      );
    }

    const orthancPublicUrl = (process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL || "")
      .trim()
      .replace(/\/+$/, "");
    const orthancBaseUrl = (process.env.ORTHANC_BASE_URL || "")
      .trim()
      .replace(/\/+$/, "");
    const username = (process.env.ORTHANC_USERNAME || "").trim();
    const password = (process.env.ORTHANC_PASSWORD || "").trim();

    if (!orthancPublicUrl || !orthancBaseUrl || !username || !password) {
      return NextResponse.json(
        { error: "Configurazione Orthanc mancante" },
        { status: 500 }
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

    const existingStudyInstanceUid = String(
      file?.orthanc?.studyInstanceUid || ""
    ).trim();

    if (existingStudyInstanceUid) {
      const redirectUrl = `${orthancPublicUrl}/ohif/viewer?StudyInstanceUIDs=${encodeURIComponent(
        existingStudyInstanceUid
      )}`;
      return NextResponse.redirect(redirectUrl);
    }

    const signedUrl = await createSignedDownloadUrl(filePath, 60);

    const r2Resp = await fetch(signedUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!r2Resp.ok) {
      return NextResponse.json(
        { error: `Download da storage fallito (${r2Resp.status})` },
        { status: 502 }
      );
    }

    const dicomBuffer = Buffer.from(await r2Resp.arrayBuffer());
    const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");

    const uploadResp = await fetch(`${orthancBaseUrl}/instances`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/dicom",
        Accept: "application/json",
      },
      body: dicomBuffer,
      cache: "no-store",
    });

    const uploadJson = (await uploadResp.json().catch(() => null)) as OrthancInstanceUploadResponse | null;

    if (!uploadResp.ok || !uploadJson?.ParentStudy || !uploadJson?.ID) {
      return NextResponse.json(
        {
          error: "Import Orthanc fallito",
          details: uploadJson,
        },
        { status: 502 }
      );
    }

    const studyId = String(uploadJson.ParentStudy);
    const instanceId = String(uploadJson.ID);
    const seriesId = String(uploadJson.ParentSeries || "");
    const patientId = String(uploadJson.ParentPatient || "");

    const studyResp = await fetch(`${orthancBaseUrl}/studies/${studyId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const studyJson = (await studyResp.json().catch(() => null)) as OrthancStudyResponse | null;

    if (!studyResp.ok || !studyJson) {
      return NextResponse.json(
        { error: `Recupero studio Orthanc fallito (${studyResp.status})` },
        { status: 502 }
      );
    }

    const studyInstanceUid = String(
      studyJson?.MainDicomTags?.StudyInstanceUID || ""
    ).trim();

    if (!studyInstanceUid) {
      return NextResponse.json(
        { error: "StudyInstanceUID non trovato" },
        { status: 502 }
      );
    }

    const updatedFile: ImagingFileMeta = {
      ...file,
      orthanc: {
        ...(file?.orthanc || {}),
        patientId: patientId || null,
        studyId: studyId || null,
        seriesId: seriesId || null,
        instanceId: instanceId || null,
        studyInstanceUid,
        ohifStudyListUrl: `${orthancPublicUrl}/ohif/`,
        orthancExplorerUrl: `${orthancPublicUrl}/ui/app/#/`,
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

    const { error: updateError } = await admin
      .from("animal_clinic_events")
      .update({ meta: updatedMeta })
      .eq("id", eventId);

    if (updateError) {
      return NextResponse.json(
        {
          error: "Studio importato ma salvataggio metadata fallito",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    const redirectUrl = `${orthancPublicUrl}/ohif/viewer?StudyInstanceUIDs=${encodeURIComponent(
      studyInstanceUid
    )}`;

    return NextResponse.redirect(redirectUrl);
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