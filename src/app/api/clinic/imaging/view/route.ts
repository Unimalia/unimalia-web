import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSignedDownloadUrl } from "@/lib/storage";
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
  const viewerBaseUrl = String(
    process.env.NEXT_PUBLIC_ORTHANC_PUBLIC_URL || ""
  )
    .trim()
    .replace(/\/+$/, "");

  return {
    viewerBaseUrl,
  };
}

function buildOhifViewerUrl(viewerBaseUrl: string, studyInstanceUid: string) {
  if (!viewerBaseUrl || !studyInstanceUid) {
    return null;
  }

  return `${viewerBaseUrl}/viewer?StudyInstanceUIDs=${encodeURIComponent(
    studyInstanceUid
  )}`;
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

    const status = normalizeImagingFileStatus(file);

    if (status === "uploaded" || status === "processing") {
      return NextResponse.json(
        {
          error: "File DICOM in elaborazione.",
          code: "IMAGING_VIEW_PROCESSING",
          status,
        },
        { status: 409 }
      );
    }

    if (status === "failed") {
      return NextResponse.json(
        {
          error: "Elaborazione DICOM non riuscita. Riprovare l'ingest.",
          code: "IMAGING_VIEW_FAILED",
          status,
        },
        { status: 409 }
      );
    }

    const { viewerBaseUrl } = getImagingGatewayConfig();

    if (!viewerBaseUrl) {
      return dicomViewError("Viewer DICOM non configurato correttamente.", 500);
    }

    const studyInstanceUid = String(
      file?.orthanc?.study_instance_uid || ""
    ).trim();

    if (!studyInstanceUid) {
      return dicomViewError(
        "Studio DICOM non ancora disponibile per il viewer."
      );
    }

    const viewerUrl =
      String(file?.orthanc?.viewer_url || "").trim() ||
      buildOhifViewerUrl(viewerBaseUrl, studyInstanceUid);

    if (!viewerUrl) {
      return dicomViewError("Viewer DICOM non disponibile per questo studio.");
    }

    return NextResponse.redirect(viewerUrl);
  } catch (err: unknown) {
    console.error("[IMAGING VIEW] Error", {
      error: err instanceof Error ? err.message : "Unknown error",
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