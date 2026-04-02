import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSignedDownloadUrl } from "@/lib/storage";
import { supabaseAdmin, createServerSupabaseClient } from "@/lib/supabase/server";
import { getBearerToken } from "@/lib/server/bearer";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";

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

    const orthancPublicUrl = (process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL || "")
      .trim()
      .replace(/\/+$/, "");
    const orthancBaseUrl = (process.env.ORTHANC_BASE_URL || "")
      .trim()
      .replace(/\/+$/, "");
    const username = (process.env.ORTHANC_USERNAME || "").trim();
    const password = (process.env.ORTHANC_PASSWORD || "").trim();

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

    const signedDownloadUrl = await createSignedDownloadUrl(filePath, 60);

    if (!isDicomFile(file)) {
      return NextResponse.redirect(signedDownloadUrl);
    }

    if (!orthancPublicUrl || !orthancBaseUrl || !username || !password) {
      return NextResponse.redirect(signedDownloadUrl);
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

    const r2Resp = await fetch(signedDownloadUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!r2Resp.ok) {
      return NextResponse.redirect(signedDownloadUrl);
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
      return NextResponse.redirect(signedDownloadUrl);
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
      return NextResponse.redirect(signedDownloadUrl);
    }

    const studyInstanceUid = String(
      studyJson?.MainDicomTags?.StudyInstanceUID || ""
    ).trim();

    if (!studyInstanceUid) {
      return NextResponse.redirect(signedDownloadUrl);
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

    await admin
      .from("animal_clinic_events")
      .update({ meta: updatedMeta })
      .eq("id", eventId);

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