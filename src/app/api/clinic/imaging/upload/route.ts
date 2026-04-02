import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  createSignedUploadUrl,
  deletePrivateFile,
  fileExists,
} from "@/lib/storage";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";
import { getBearerToken } from "@/lib/server/bearer";

type AuthenticatedUserResult = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: {
    id: string;
    email?: string | null;
  };
};

type ProfessionalProfileRoleRow = {
  role: string | null;
};

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

    console.error("[IMAGING AUTH] bearer failed", {
      hasToken: true,
      error: bearerUserResp.error?.message ?? null,
    });
  } else {
    console.error("[IMAGING AUTH] bearer missing");
  }

  const cookieSupabase = await createServerSupabaseClient();
  const cookieUserResp = await cookieSupabase.auth.getUser();

  if (!cookieUserResp.error && cookieUserResp.data?.user) {
    return {
      supabase: cookieSupabase,
      user: cookieUserResp.data.user,
    };
  }

  console.error("[IMAGING AUTH] cookie failed", {
    error: cookieUserResp.error?.message ?? null,
  });

  return null;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-]+/g, "_");
}

function buildImagingTitle(modality?: string | null, bodyPart?: string | null) {
  const cleanModality = modality?.trim() || "Imaging";
  const cleanBodyPart = bodyPart?.trim();
  return cleanBodyPart ? `${cleanModality} ${cleanBodyPart}` : cleanModality;
}

function parsePositiveInt(value: FormDataEntryValue | null) {
  const n = Number(String(value || "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function isAllowedImagingFile(fileName: string, mimeType?: string | null) {
  const allowedImagingMimeTypes = new Set([
    "application/dicom",
    "application/pdf",
    "image/jpeg",
    "image/png",
  ]);

  const allowedImagingExtensions = [".dcm", ".dicom", ".pdf", ".jpg", ".jpeg", ".png"];

  const lowerName = String(fileName || "").toLowerCase();
  const hasAllowedExtension = allowedImagingExtensions.some((ext) => lowerName.endsWith(ext));
  const hasAllowedMime = !mimeType || allowedImagingMimeTypes.has(String(mimeType).toLowerCase());

  return hasAllowedExtension || hasAllowedMime;
}

const MAX_IMAGING_FILE_SIZE_BYTES = 500 * 1024 * 1024;

export async function POST(req: Request) {
  let uploadedPathToCleanup: string | null = null;
  let trackedAnimalId: string | null = null;

  const auth = await resolveAuthenticatedUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabase, user } = auth;
  const admin = supabaseAdmin();

  const professionalRole = await getProfessionalRole(user.id);

  if (professionalRole && professionalRole !== "veterinarian") {
    return NextResponse.json(
      { error: "Accesso clinico riservato ai veterinari." },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();

    const mode = String(formData.get("mode") || "prepare").trim().toLowerCase();
    const animalId = String(formData.get("animalId") || "").trim();
    trackedAnimalId = animalId;

    const modality = String(formData.get("modality") || "").trim() || null;
    const bodyPart = String(formData.get("bodyPart") || "").trim() || null;
    const description = String(formData.get("description") || "").trim() || null;
    const visibility = String(formData.get("visibility") || "").trim() || "owner";
    const eventDateRaw = String(formData.get("eventDate") || "").trim();

    if (!animalId) {
      return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
    }

    const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "upload");

    if (!grant.ok) {
      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        action: "imaging.upload",
        target_type: "animal",
        target_id: animalId,
        animal_id: animalId,
        result: "denied",
        reason: grant.reason,
      });

      return NextResponse.json({ error: grant.reason }, { status: 403 });
    }

    if (mode === "prepare") {
      const originalFileName = String(formData.get("fileName") || "").trim();
      const mime = String(formData.get("fileType") || "").trim() || "application/octet-stream";
      const size = parsePositiveInt(formData.get("fileSize"));

      if (!originalFileName) {
        return NextResponse.json({ error: "fileName mancante" }, { status: 400 });
      }

      if (!isAllowedImagingFile(originalFileName, mime)) {
        return NextResponse.json(
          { error: "Formato imaging non consentito. Usa DCM, DICOM, PDF, JPG o PNG." },
          { status: 400 }
        );
      }

      if (!size || size > MAX_IMAGING_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File imaging non valido o troppo grande (max 500 MB)." },
          { status: 400 }
        );
      }

      const eventId = randomUUID();
      const fileId = randomUUID();

      const safeFileName = sanitizeFileName(originalFileName);
      const storedFileName = `${Date.now()}_${safeFileName}`;
      const path = `${animalId}/${eventId}/${storedFileName}`;

      const signed = await createSignedUploadUrl({
        path,
        contentType: mime,
        expiresInSeconds: 60 * 15,
      });

      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_organization_id: grant.actor_organization_id,
        action: "imaging.upload.prepare",
        target_type: "event",
        target_id: eventId,
        animal_id: animalId,
        result: "success",
        diff: {
          fileId,
          path,
          mime,
          size,
        },
      });

      return NextResponse.json({
        ok: true,
        mode: "prepare",
        upload: {
          url: signed.url,
          path,
          eventId,
          fileId,
          fileName: safeFileName,
          mime,
          size,
          expiresInSeconds: signed.expiresInSeconds,
        },
      });
    }

    if (mode === "complete") {
      const eventId = String(formData.get("eventId") || "").trim();
      const fileId = String(formData.get("fileId") || "").trim();
      const path = String(formData.get("path") || "").trim();
      const fileName = String(formData.get("fileName") || "").trim();
      const mime = String(formData.get("fileType") || "").trim() || "application/octet-stream";
      const size = parsePositiveInt(formData.get("fileSize"));

      if (!eventId || !fileId || !path || !fileName || !size) {
        return NextResponse.json(
          { error: "Dati upload incompleti per completare il salvataggio imaging." },
          { status: 400 }
        );
      }

      if (!isAllowedImagingFile(fileName, mime)) {
        return NextResponse.json(
          { error: "Formato imaging non consentito. Usa DCM, DICOM, PDF, JPG o PNG." },
          { status: 400 }
        );
      }

      if (size > MAX_IMAGING_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File imaging troppo grande (max 500 MB)." },
          { status: 400 }
        );
      }

      const exists = await fileExists(path);
      if (!exists) {
        return NextResponse.json(
          { error: "File non trovato su storage. Ripeti l’upload." },
          { status: 400 }
        );
      }

      const finalEventDate = eventDateRaw
        ? new Date(eventDateRaw).toISOString()
        : new Date().toISOString();

      const title = buildImagingTitle(modality, bodyPart);

      const eventMeta = {
        has_attachments: true,
        imaging: {
          modality,
          body_part: bodyPart,
          files: [
            {
              id: fileId,
              path,
              name: fileName,
              size,
              mime,
              orthanc: null,
            },
          ],
        },
      };

      uploadedPathToCleanup = path;

      const { error: eventInsertError } = await admin
        .from("animal_clinic_events")
        .insert({
          id: eventId,
          animal_id: animalId,
          event_date: finalEventDate,
          type: "imaging",
          title,
          description,
          visibility,
          meta: eventMeta,
          created_by_user_id: user.id,
          source: "veterinarian",
          status: "active",
        });

      if (eventInsertError) {
        throw new Error(`Errore salvataggio evento clinico: ${eventInsertError.message}`);
      }

      const { error: fileInsertError } = await admin
        .from("animal_clinic_event_files")
        .insert({
          id: fileId,
          event_id: eventId,
          animal_id: animalId,
          path,
          filename: fileName,
          mime,
          size,
          created_by_user_id: user.id,
        });

      if (fileInsertError) {
        throw new Error(`Errore salvataggio file evento: ${fileInsertError.message}`);
      }

      await admin.from("clinic_imaging_uploads").insert({
        clinic_id: grant.actor_organization_id ?? null,
        user_id: user.id,
        animal_id: animalId,
        event_id: eventId,
        file_id: fileId,
        file_name: fileName,
        file_size: size,
        mime,
        modality,
        status: "completed",
      });

      uploadedPathToCleanup = null;

      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_organization_id: grant.actor_organization_id,
        action: "imaging.upload.complete",
        target_type: "event",
        target_id: eventId,
        animal_id: animalId,
        result: "success",
      });

      return NextResponse.json({
        ok: true,
        mode: "complete",
        data: {
          eventId,
          fileId,
          animalId,
          path,
          type: "imaging",
          title,
          visibility,
          imaging: {
            modality,
            body_part: bodyPart,
            files: [
              {
                id: fileId,
                path,
                name: fileName,
                size,
                mime,
                orthanc: null,
              },
            ],
          },
        },
      });
    }

    return NextResponse.json({ error: "Mode non valido" }, { status: 400 });
  } catch (err: unknown) {
    console.error("UPLOAD IMAGING ERROR:", err);

    try {
      await admin.from("clinic_imaging_uploads").insert({
        clinic_id: null,
        user_id: user.id,
        animal_id: trackedAnimalId,
        event_id: null,
        file_id: null,
        file_name: null,
        file_size: null,
        mime: null,
        modality: null,
        status: "failed",
      });
    } catch (trackingErr) {
      console.error("IMAGING FAILED TRACKING ERROR:", trackingErr);
    }

    if (uploadedPathToCleanup) {
      try {
        await deletePrivateFile(uploadedPathToCleanup);
      } catch (cleanupErr) {
        console.error("UPLOAD CLEANUP ERROR:", cleanupErr);
      }
    }

    return NextResponse.json(
      {
        error: "Errore upload imaging",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}