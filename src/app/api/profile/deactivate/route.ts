import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { syncProfessionalAuth } from "@/lib/syncProfessionalAuth";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = supabaseAdmin();

    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    const user = userResp?.user;

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        is_archived: true,
        archived_at: now,
        is_deleted: false,
        deleted_at: null,
      })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message || "Errore aggiornamento profilo" },
        { status: 500 }
      );
    }

    const { data: professionals, error: professionalsError } = await admin
      .from("professionals")
      .select("id")
      .eq("owner_id", user.id);

    if (professionalsError) {
      return NextResponse.json(
        { error: professionalsError.message || "Errore aggiornamento profilo professionale" },
        { status: 500 }
      );
    }

    if (professionals && professionals.length > 0) {
      const professionalIds = professionals.map((row) => row.id);

      const { error: proArchiveError } = await admin
        .from("professionals")
        .update({
          is_archived: true,
          archived_at: now,
          is_deleted: false,
          deleted_at: null,
          approved: false,
          public_visible: false,
        })
        .in("id", professionalIds);

      if (proArchiveError) {
        return NextResponse.json(
          { error: proArchiveError.message || "Errore archiviazione profilo professionale" },
          { status: 500 }
        );
      }

      for (const professionalId of professionalIds) {
        const syncResult = await syncProfessionalAuth(professionalId);

        if (!syncResult.ok) {
          return NextResponse.json(
            {
              error: `Profilo archiviato, ma sync Auth professionista fallita: ${syncResult.error}`,
            },
            { status: 500 }
          );
        }
      }
    } else {
      const existingAppMetadata =
        user.app_metadata && typeof user.app_metadata === "object"
          ? user.app_metadata
          : {};

      const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.id, {
        ban_duration: "876000h",
        app_metadata: {
          ...existingAppMetadata,
          account_disabled: true,
          account_disabled_at: now,
          account_disabled_reason: "self_service_account_archived",
          is_professional: false,
          is_vet: false,
          professional_type: null,
        },
      });

      if (authUpdateError) {
        return NextResponse.json(
          { error: authUpdateError.message || "Errore disattivazione account" },
          { status: 500 }
        );
      }
    }

    const authUser = await admin.auth.admin.getUserById(user.id);

    if (authUser.error || !authUser.data?.user) {
      return NextResponse.json(
        { error: authUser.error?.message || "Errore recupero utente Auth" },
        { status: 500 }
      );
    }

    const currentAppMetadata =
      authUser.data.user.app_metadata && typeof authUser.data.user.app_metadata === "object"
        ? authUser.data.user.app_metadata
        : {};

    const { error: finalAuthUpdateError } = await admin.auth.admin.updateUserById(user.id, {
      ban_duration: "876000h",
      app_metadata: {
        ...currentAppMetadata,
        account_disabled: true,
        account_disabled_at: now,
        account_disabled_reason: "self_service_account_archived",
      },
    });

    if (finalAuthUpdateError) {
      return NextResponse.json(
        { error: finalAuthUpdateError.message || "Errore disattivazione account" },
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