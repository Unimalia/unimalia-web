import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

function buildArchivedEmail(originalEmail: string | null | undefined, userId: string) {
  const raw = String(originalEmail || "").trim().toLowerCase();
  const safeLocal = raw.includes("@") ? raw.split("@")[0] : "utente";
  const compactUserId = userId.replace(/-/g, "");
  const ts = Date.now();

  return `archived+${safeLocal}.${compactUserId}.${ts}@unimalia.local`;
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = supabaseAdmin();

    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    const user = userResp?.user;

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const archivedEmail = buildArchivedEmail(user.email, user.id);

    const existingAppMetadata =
      user.app_metadata && typeof user.app_metadata === "object"
        ? user.app_metadata
        : {};

    const existingUserMetadata =
      user.user_metadata && typeof user.user_metadata === "object"
        ? user.user_metadata
        : {};

    const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.id, {
      email: archivedEmail,
      ban_duration: "876000h",
      app_metadata: {
        ...existingAppMetadata,
        account_disabled: true,
        account_disabled_at: new Date().toISOString(),
        account_disabled_reason: "self_service_profile_closure",
      },
      user_metadata: {
        ...existingUserMetadata,
        original_email_archived_from: user.email ?? null,
      },
    });

    if (authUpdateError) {
      return NextResponse.json(
        { error: authUpdateError.message || "Errore disattivazione account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Account disattivato correttamente",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Errore durante la disattivazione account",
      },
      { status: 500 }
    );
  }
}