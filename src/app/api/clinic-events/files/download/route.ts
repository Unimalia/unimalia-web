import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { safeWriteAudit } from "@/lib/server/safeAudit";
import { getBearerToken } from "@/lib/server/bearer";
import { isUuid } from "@/lib/server/validators";

type ClinicEventFileRow = {
  id: string;
  animal_id: string;
  event_id: string;
  path: string;
  filename: string | null;
};

type ClinicEventAccessRow = {
  id: string;
  created_by_user_id: string | null;
  animal_id: string;
  status: string | null;
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

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const fileId = String(url.searchParams.get("fileId") || "").trim();

  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  if (!isUuid(fileId)) {
    return NextResponse.json({ error: "fileId invalid" }, { status: 400 });
  }

  const { data: fileRowData, error: fileError } = await admin
    .from("animal_clinic_event_files")
    .select("id, animal_id, event_id, path, filename")
    .eq("id", fileId)
    .single<ClinicEventFileRow>();

  if (fileError || !fileRowData) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileRow = fileRowData;
  const animalId = String(fileRow.animal_id || "");
  const eventId = String(fileRow.event_id || "");

  if (!animalId || !isUuid(animalId)) {
    return NextResponse.json({ error: "Invalid file animal_id" }, { status: 400 });
  }

  if (!eventId || !isUuid(eventId)) {
    return NextResponse.json({ error: "Invalid file event_id" }, { status: 400 });
  }

  const grant = await requireOwnerOrGrant(
    supabase as RequireOwnerOrGrantClient,
    user.id,
    animalId,
    "read"
  );

  let canAccess = grant.ok;
  let accessMode: "full" | "own_only" | "denied" = grant.ok ? "full" : "denied";

  if (!grant.ok) {
    const { data: eventRow, error: eventError } = await admin
      .from("animal_clinic_events")
      .select("id, created_by_user_id, animal_id, status")
      .eq("id", eventId)
      .eq("animal_id", animalId)
      .neq("status", "void")
      .maybeSingle<ClinicEventAccessRow>();

    if (eventError) {
      await safeWriteAudit(supabase, {
        req,
        actor_user_id: user.id,
        action: "file.download",
        target_type: "file",
        target_id: fileRow.id,
        animal_id: animalId,
        result: "error",
        reason: eventError.message,
      });

      return NextResponse.json({ error: "Errore verifica accesso file." }, { status: 500 });
    }

    if (eventRow && eventRow.created_by_user_id === user.id) {
      canAccess = true;
      accessMode = "own_only";
    }
  }

  if (!canAccess) {
    const denyReason = grant.ok ? "Accesso negato" : grant.reason;

    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      action: "file.download",
      target_type: "file",
      target_id: fileRow.id,
      animal_id: animalId,
      result: "denied",
      reason: denyReason,
    });

    return NextResponse.json({ error: denyReason }, { status: 403 });
  }

  const { data, error } = await admin.storage
    .from("clinic-event-files")
    .createSignedUrl(fileRow.path, 60);

  if (error || !data?.signedUrl) {
    await safeWriteAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_organization_id: grant.ok ? grant.actor_organization_id : null,
      action: "file.download",
      target_type: "file",
      target_id: fileRow.id,
      animal_id: animalId,
      result: "error",
      reason: error?.message || "signed url failed",
    });

    return NextResponse.json({ error: "Impossibile generare link download." }, { status: 500 });
  }

  await safeWriteAudit(supabase, {
    req,
    actor_user_id: user.id,
    actor_organization_id: grant.ok ? grant.actor_organization_id : null,
    action: "file.download",
    target_type: "file",
    target_id: fileRow.id,
    animal_id: animalId,
    result: "success",
    reason: accessMode === "own_only" ? "fallback_own_event_file_only" : undefined,
  });

  return NextResponse.json(
    {
      ok: true,
      mode: accessMode,
      url: data.signedUrl,
      filename: fileRow.filename ?? null,
    },
    { status: 200 }
  );
}
