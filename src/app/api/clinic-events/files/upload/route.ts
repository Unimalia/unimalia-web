import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { sendOwnerAnimalUpdateEmail } from "@/lib/email/sendOwnerAnimalUpdateEmail";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type EventPriority = "low" | "normal" | "high" | "urgent";
type EventVisibility = "owner" | "professionals" | "emergency";
type EventSource = "owner" | "professional" | "veterinarian";

type ClinicEventMeta = Record<string, unknown>;

type ClinicEventRow = {
  id: string;
  animal_id: string;
  title: string | null;
  description: string | null;
  event_date: string | null;
  type: string | null;
  visibility: EventVisibility | null;
  source: EventSource | null;
  priority: EventPriority | null;
  meta: ClinicEventMeta | null;
  status: string | null;
  created_by_user_id: string | null;
};

type UploadedFileRow = {
  id: string;
  event_id: string;
  animal_id: string;
  path: string;
  filename: string | null;
  mime: string | null;
  size: number | null;
  created_by_user_id: string | null;
  created_at: string;
};

type UploadedFileResponseRow = {
  id: string;
  event_id: string;
  animal_id: string;
  filename: string | null;
  mime: string | null;
  size: number | null;
  created_by_user_id: string | null;
  created_at: string;
};

type RequireOwnerOrGrantClient = Parameters<typeof requireOwnerOrGrant>[0];

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

function isDicomFile(fileName?: string | null, mimeType?: string | null) {
  const lowerName = String(fileName || "").toLowerCase().trim();
  const lowerMime = String(mimeType || "").toLowerCase().trim();

  return (
    lowerName.endsWith(".dcm") ||
    lowerName.endsWith(".dicom") ||
    lowerMime === "application/dicom" ||
    lowerMime === "application/dicom+json" ||
    lowerMime === "application/dicom+xml"
  );
}

function getSafeFilename(originalName?: string | null) {
  const safe = String(originalName || "documento")
    .replace(/[^\w.\-() ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return safe || "documento";
}

function parseMetaNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseMetaString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function toUploadedFileResponse(row: UploadedFileRow): UploadedFileResponseRow {
  return {
    id: row.id,
    event_id: row.event_id,
    animal_id: row.animal_id,
    filename: row.filename,
    mime: row.mime,
    size: row.size,
    created_by_user_id: row.created_by_user_id,
    created_at: row.created_at,
  };
}

export async function POST(req: Request) {
  const token = getBearerToken(req);

  if (!token) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { error: "Server misconfigured (Supabase env missing)" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const admin = supabaseAdmin();

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const professionalRole = await getProfessionalRole(user.id);

  if (professionalRole && professionalRole !== "veterinarian") {
    return NextResponse.json(
      { error: "Accesso clinico riservato ai veterinari." },
      { status: 403 }
    );
  }

  const form = await req.formData();

  const eventId = String(form.get("eventId") || "").trim();
  const files = form.getAll("files");

  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  if (!isUuid(eventId)) {
    return NextResponse.json({ error: "eventId invalid" }, { status: 400 });
  }

  if (!files.length) {
    return NextResponse.json({ error: "files required" }, { status: 400 });
  }

  const { data: ev, error: evErr } = await admin
    .from("animal_clinic_events")
    .select(
      "id, animal_id, title, description, event_date, type, visibility, source, priority, meta, status, created_by_user_id"
    )
    .eq("id", eventId)
    .neq("status", "void")
    .single<ClinicEventRow>();

  if (evErr || !ev) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (ev.type === "imaging") {
    return NextResponse.json(
      {
        error: "Per gli eventi imaging usa solo il caricamento dedicato imaging.",
      },
      { status: 400 }
    );
  }

  const animalId = String(ev.animal_id || "");

  if (!animalId || !isUuid(animalId)) {
    return NextResponse.json({ error: "Invalid event animal_id" }, { status: 400 });
  }

  const grant = await requireOwnerOrGrant(
    supabase as RequireOwnerOrGrantClient,
    user.id,
    animalId,
    "write"
  );

  if (!grant.ok) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: null,
      action: "file.upload",
      target_type: "event",
      target_id: eventId,
      animal_id: animalId,
      result: "denied",
      reason: grant.reason,
    });

    return NextResponse.json({ error: grant.reason }, { status: 403 });
  }

  const source = String(ev.source || "");
  const createdByUserId = String(ev.created_by_user_id || "").trim();

  if (source !== "owner") {
    const reason = "Non autorizzato: puoi caricare file solo su eventi owner o sui tuoi eventi.";

    if (!createdByUserId || createdByUserId !== user.id) {
      await safeWriteAudit(supabase, {
        req,
        actor_user_id: user.id,
        actor_org_id: grant.actor_org_id,
        action: "file.upload",
        target_type: "event",
        target_id: eventId,
        animal_id: animalId,
        result: "denied",
        reason,
      });

      return NextResponse.json({ error: reason }, { status: 403 });
    }
  }

  const bucket = "clinic-event-files";
  const uploaded: UploadedFileRow[] = [];
  const uploadedPaths: string[] = [];

  try {
    for (const f of files) {
      if (!(f instanceof File)) continue;

      if (f.size <= 0 || f.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File non valido o troppo grande (max 500 MB)" },
          { status: 400 }
        );
      }

      const safeName = getSafeFilename(f.name);

      if (isDicomFile(safeName, f.type)) {
        return NextResponse.json(
          {
            error:
              "I file DICOM (.dcm/.dicom) non possono essere caricati come allegati normali. Usa la sezione Imaging.",
          },
          { status: 400 }
        );
      }

      if (!f.type || !ALLOWED_MIME_TYPES.has(f.type)) {
        return NextResponse.json({ error: "Tipo file non consentito" }, { status: 400 });
      }

      const path = `${animalId}/${eventId}/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}_${safeName}`;

      const { error: upErr } = await admin.storage.from(bucket).upload(path, f, {
        contentType: f.type,
        upsert: false,
      });

      if (upErr) {
        await safeWriteAudit(supabase, {
          req,
          actor_user_id: user.id,
          actor_org_id: grant.actor_org_id,
          action: "file.upload",
          target_type: "event",
          target_id: eventId,
          animal_id: animalId,
          result: "error",
          reason: upErr.message,
        });

        return NextResponse.json({ error: upErr.message || "Upload failed" }, { status: 400 });
      }

      uploadedPaths.push(path);

      const { data: row, error: insErr } = await admin
        .from("animal_clinic_event_files")
        .insert([
          {
            event_id: eventId,
            animal_id: animalId,
            path,
            filename: f.name || safeName,
            mime: f.type || null,
            size: f.size || null,
            created_by_user_id: user.id,
          },
        ])
        .select("id, event_id, animal_id, path, filename, mime, size, created_by_user_id, created_at")
        .single<UploadedFileRow>();

      if (insErr || !row) {
        await safeWriteAudit(supabase, {
          req,
          actor_user_id: user.id,
          actor_org_id: grant.actor_org_id,
          action: "file.upload",
          target_type: "event",
          target_id: eventId,
          animal_id: animalId,
          result: "error",
          reason: insErr?.message || "DB insert failed",
        });

        try {
          await admin.storage.from(bucket).remove([path]);
        } catch (cleanupError) {
          console.error("[FILE_UPLOAD_CLEANUP_ERROR]", cleanupError);
        }

        return NextResponse.json(
          { error: insErr?.message || "DB insert failed" },
          { status: 400 }
        );
      }

      uploaded.push(row);
    }

    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "file.upload",
      target_type: "event",
      target_id: eventId,
      animal_id: animalId,
      result: "success",
      diff: { uploadedCount: uploaded.length },
    });

    try {
      if (ev.source !== "owner" && uploaded.length > 0) {
        const signedAttachments: Array<{ name: string; url: string }> = [];

        for (const file of uploaded) {
          const { data: signed, error: signedErr } = await admin.storage
            .from(bucket)
            .createSignedUrl(file.path, 60 * 60 * 24 * 7);

          if (!signedErr && signed?.signedUrl) {
            signedAttachments.push({
              name: file.filename || "Allegato",
              url: signed.signedUrl,
            });
          }
        }

        await sendOwnerAnimalUpdateEmail({
          animalId,
          eventTitle: ev.title || "Nuovo evento clinico",
          eventDate: ev.event_date || null,
          eventNotes: ev.description || null,
          action: "created",
          eventType: ev.type || null,
          visibility: ev.visibility ?? null,
          source: ev.source ?? null,
          priority: ev.priority ?? null,
          weightKg: parseMetaNumber(ev.meta?.weight_kg),
          therapyStartDate: parseMetaString(ev.meta?.therapy_start_date),
          therapyEndDate: parseMetaString(ev.meta?.therapy_end_date),
          vetSignature: parseMetaString(ev.meta?.created_by_member_label),
          meta: ev.meta ?? null,
          attachments: signedAttachments,
        });
      }
    } catch (emailError) {
      console.error("[CLINIC_EVENT_OWNER_EMAIL_UPLOAD]", emailError);
    }

    return NextResponse.json(
      { ok: true, files: uploaded.map(toUploadedFileResponse) },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (uploadedPaths.length > 0) {
      try {
        await admin.storage.from(bucket).remove(uploadedPaths);
      } catch (cleanupError) {
        console.error("[FILE_UPLOAD_ROLLBACK_ERROR]", cleanupError);
      }
    }

    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_org_id: grant.actor_org_id,
      action: "file.upload",
      target_type: "event",
      target_id: eventId,
      animal_id: animalId,
      result: "error",
      reason: error instanceof Error ? error.message : "Unhandled server error",
    });

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}