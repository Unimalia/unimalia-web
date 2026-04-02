import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSignedDownloadUrl } from "@/lib/storage";
import { requireOwnerOrGrant } from "@/lib/server/requireOwnerOrGrant";
import { writeAudit } from "@/lib/server/audit";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getBearerToken } from "@/lib/server/bearer";

type DownloadBody = {
  eventId?: string;
  filePath?: string;
};

type ImagingFileRow = {
  id: string;
  event_id: string;
  animal_id: string;
  path: string;
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

export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

  try {
    const body = (await req.json()) as DownloadBody;
    const eventId = body?.eventId;
    const filePath = body?.filePath;

    if (!eventId || !filePath) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
    }

    const { data: fileRow, error: fileError } = await admin
      .from("animal_clinic_event_files")
      .select("id, event_id, animal_id, path")
      .eq("event_id", eventId)
      .eq("path", filePath)
      .single<ImagingFileRow>();

    if (fileError || !fileRow) {
      return NextResponse.json({ error: "File non trovato" }, { status: 404 });
    }

    const animalId = fileRow.animal_id;

    const grant = await requireOwnerOrGrant(supabase, user.id, animalId, "read");

    if (!grant.ok) {
      await writeAudit(supabase, {
        req,
        actor_user_id: user.id,
        action: "imaging.download",
        target_type: "file",
        target_id: fileRow.id,
        animal_id: animalId,
        result: "denied",
        reason: grant.reason,
      });

      return NextResponse.json({ error: grant.reason }, { status: 403 });
    }

    const signedUrl = await createSignedDownloadUrl(fileRow.path, 60);

    await writeAudit(supabase, {
      req,
      actor_user_id: user.id,
      actor_organization_id: grant.actor_organization_id,
      action: "imaging.download",
      target_type: "file",
      target_id: fileRow.id,
      animal_id: animalId,
      result: "success",
    });

    return NextResponse.json({ ok: true, url: signedUrl });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore download imaging" },
      { status: 500 }
    );
  }
}