import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { syncProfessionalAuth } from "@/lib/syncProfessionalAuth";

function buildDeletedEmail(userId: string) {
  const compactUserId = userId.replace(/-/g, "");
  const ts = Date.now();

  return `deleted+${compactUserId}.${ts}@unimalia.local`;
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

    const now = new Date().toISOString();
    const deletedEmail = buildDeletedEmail(user.id);

    const { data: professionals, error: professionalsReadError } = await admin
      .from("professionals")
      .select("id")
      .eq("owner_id", user.id);

    if (professionalsReadError) {
      return NextResponse.json(
        { error: professionalsReadError.message || "Errore lettura profili professionali" },
        { status: 500 }
      );
    }

    const professionalIds = (professionals ?? []).map((row) => row.id);

    if (professionalIds.length > 0) {
      const { error: professionalsUpdateError } = await admin
        .from("professionals")
        .update({
          approved: false,
          public_visible: false,
          is_vet: false,
          is_archived: false,
          archived_at: null,
          is_deleted: true,
          deleted_at: now,
          display_name: null,
          first_name: null,
          last_name: null,
          business_name: null,
          legal_name: null,
          email: null,
          phone: null,
          website: null,
          description: null,
          city: null,
          province: null,
          address: null,
          tax_code: null,
          vat_number: null,
          pec: null,
          sdi_code: null,
          billing_address: null,
          billing_city: null,
          billing_province: null,
          billing_cap: null,
          director_name: null,
          director_order_province: null,
          director_fnovi_number: null,
          authorization_code: null,
          authorization_issuer: null,
          rejection_reason: null,
        })
        .in("id", professionalIds);

      if (professionalsUpdateError) {
        return NextResponse.json(
          { error: professionalsUpdateError.message || "Errore anonimizzazione profili professionali" },
          { status: 500 }
        );
      }
    }

    const { error: profileUpdateError } = await admin
      .from("profiles")
      .update({
        is_archived: false,
        archived_at: null,
        is_deleted: true,
        deleted_at: now,
        full_name: null,
        first_name: null,
        last_name: null,
        city: null,
        province: null,
        country: "IT",
        fiscal_code: null,
        address: null,
        cap: null,
        phone: null,
        phone_verified: false,
        phone_verified_at: null,
        role: "owner",
        is_admin: false,
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      return NextResponse.json(
        { error: profileUpdateError.message || "Errore anonimizzazione profilo" },
        { status: 500 }
      );
    }

    for (const professionalId of professionalIds) {
      const syncResult = await syncProfessionalAuth(professionalId);

      if (!syncResult.ok) {
        return NextResponse.json(
          {
            error: `Profilo eliminato, ma sync Auth professionista fallita: ${syncResult.error}`,
          },
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

    const currentUserMetadata =
      authUser.data.user.user_metadata && typeof authUser.data.user.user_metadata === "object"
        ? authUser.data.user.user_metadata
        : {};

    const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.id, {
      email: deletedEmail,
      ban_duration: "876000h",
      app_metadata: {
        ...currentAppMetadata,
        account_disabled: true,
        account_disabled_at: now,
        account_disabled_reason: "self_service_account_deleted",
        account_deleted: true,
        account_deleted_at: now,
        is_professional: false,
        is_vet: false,
        professional_type: null,
      },
      user_metadata: {
        ...currentUserMetadata,
        original_email_archived_from: null,
        deleted_at: now,
      },
    });

    if (authUpdateError) {
      return NextResponse.json(
        { error: authUpdateError.message || "Errore eliminazione account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Account eliminato definitivamente",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Errore durante lâ€™eliminazione account",
      },
      { status: 500 }
    );
  }
}
