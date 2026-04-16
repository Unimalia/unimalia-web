import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminUser } from "@/lib/adminAccess";
import { writeAdminAuditLog } from "@/lib/adminAudit";
import { syncProfessionalAuth } from "@/lib/syncProfessionalAuth";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  is_archived: boolean | null;
  is_deleted: boolean | null;
};

type ProfessionalRow = {
  id: string;
  owner_id: string | null;
  approved: boolean | null;
  is_archived: boolean | null;
  is_deleted: boolean | null;
};

type AuthUserLike = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

function sanitizeRedirectTo(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/superadmin")) return "/superadmin/recupero-account";
  if (raw.startsWith("//")) return "/superadmin/recupero-account";
  return raw;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isLegacyArchivedEmail(email: string | null | undefined) {
  const raw = String(email || "").trim().toLowerCase();
  return (
    raw.endsWith("@unimalia.local") &&
    (raw.startsWith("archived+") || raw.startsWith("deleted+"))
  );
}

export async function POST(req: Request) {
  const auth = await supabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const formData = await req.formData();
  const userId = String(formData.get("userId") || "").trim();
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  if (!userId) {
    return NextResponse.json({ error: "userId mancante" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const authUserResp = await admin.auth.admin.getUserById(userId);
  const authUser = (authUserResp.data?.user ?? null) as AuthUserLike | null;

  if (authUserResp.error || !authUser) {
    return NextResponse.json(
      { error: authUserResp.error?.message || "Utente Auth non trovato" },
      { status: 404 }
    );
  }

  const currentAppMetadata =
    authUser.app_metadata && typeof authUser.app_metadata === "object"
      ? authUser.app_metadata
      : {};

  const currentUserMetadata =
    authUser.user_metadata && typeof authUser.user_metadata === "object"
      ? authUser.user_metadata
      : {};

  const originalArchivedEmail = readString(
    currentUserMetadata.original_email_archived_from
  );
  const currentEmail = readString(authUser.email);
  const shouldRestoreLegacyEmail =
    !!originalArchivedEmail &&
    (isLegacyArchivedEmail(currentEmail) || currentEmail !== originalArchivedEmail);

  const { data: profileData, error: profileReadError } = await admin
    .from("profiles")
    .select("id, is_archived, is_deleted")
    .eq("id", userId)
    .maybeSingle();

  if (profileReadError) {
    return NextResponse.json(
      { error: profileReadError.message || "Errore lettura profilo" },
      { status: 500 }
    );
  }

  const profile = (profileData ?? null) as ProfileRow | null;

  if (profile?.is_deleted === true) {
    return NextResponse.json(
      { error: "Questo account risulta eliminato definitivamente e non è recuperabile." },
      { status: 409 }
    );
  }

  const { data: professionalsData, error: professionalsReadError } = await admin
    .from("professionals")
    .select("id, owner_id, approved, is_archived, is_deleted")
    .eq("owner_id", userId);

  if (professionalsReadError) {
    return NextResponse.json(
      { error: professionalsReadError.message || "Errore lettura profili professionali" },
      { status: 500 }
    );
  }

  const professionals = ((professionalsData ?? []) as unknown[]) as ProfessionalRow[];

  const deletedProfessionals = professionals.filter((row) => row.is_deleted === true);
  if (deletedProfessionals.length > 0) {
    return NextResponse.json(
      {
        error:
          "Esiste almeno un profilo professionale eliminato definitivamente collegato a questo account. Recupero bloccato.",
      },
      { status: 409 }
    );
  }

  const authUpdatePayload: {
    ban_duration: string;
    email?: string;
    app_metadata: Record<string, unknown>;
    user_metadata: Record<string, unknown>;
  } = {
    ban_duration: "0s",
    app_metadata: {
      ...currentAppMetadata,
      account_disabled: false,
      account_disabled_at: null,
      account_disabled_reason: null,
      account_deleted: false,
      account_deleted_at: null,
    },
    user_metadata: {
      ...currentUserMetadata,
      original_email_archived_from: null,
    },
  };

  if (shouldRestoreLegacyEmail) {
    authUpdatePayload.email = originalArchivedEmail;
  }

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(
    userId,
    authUpdatePayload
  );

  if (authUpdateError) {
    return NextResponse.json(
      { error: authUpdateError.message || "Errore ripristino Auth" },
      { status: 500 }
    );
  }

  if (profile) {
    const { error: profileRestoreError } = await admin
      .from("profiles")
      .update({
        is_archived: false,
        archived_at: null,
      })
      .eq("id", userId);

    if (profileRestoreError) {
      return NextResponse.json(
        { error: profileRestoreError.message || "Errore ripristino profilo" },
        { status: 500 }
      );
    }
  }

  const archivedProfessionalIds = professionals
    .filter((row) => row.is_archived === true && row.is_deleted !== true)
    .map((row) => row.id);

  if (archivedProfessionalIds.length > 0) {
    const { error: professionalsRestoreError } = await admin
      .from("professionals")
      .update({
        is_archived: false,
        archived_at: null,
        approved: false,
        public_visible: false,
      })
      .in("id", archivedProfessionalIds);

    if (professionalsRestoreError) {
      return NextResponse.json(
        {
          error:
            professionalsRestoreError.message ||
            "Errore ripristino profili professionali",
        },
        { status: 500 }
      );
    }

    for (const professionalId of archivedProfessionalIds) {
      const syncResult = await syncProfessionalAuth(professionalId);

      if (!syncResult.ok) {
        return NextResponse.json(
          {
            error: `Ripristino completato, ma sync Auth professionista fallita: ${syncResult.error}`,
          },
          { status: 500 }
        );
      }
    }
  }

  await writeAdminAuditLog({
    adminId: user.id,
    action: "account_restored",
    targetType: "account",
    targetId: userId,
    meta: {
      redirectTo,
      legacy_email_restored: shouldRestoreLegacyEmail,
      restored_email: shouldRestoreLegacyEmail ? originalArchivedEmail : null,
      profile_restored: !!profile,
      restored_professionals_count: archivedProfessionalIds.length,
    },
  });

  return NextResponse.redirect(new URL(redirectTo, req.url), 303);
}