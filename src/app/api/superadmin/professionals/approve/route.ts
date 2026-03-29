import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminUser } from "@/lib/adminAccess";
import { syncProfessionalAuth } from "@/lib/syncProfessionalAuth";
import { writeAdminAuditLog } from "@/lib/adminAudit";
import { sendProfessionalApprovedEmail } from "@/lib/email/sendProfessionalApprovedEmail";

export const dynamic = "force-dynamic";

type ProfessionalBeforeRow = {
  id: string;
  owner_id: string | null;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  category: string | null;
  is_vet: boolean | null;
};

type AuthUserByIdResponse = {
  data?: {
    user?: {
      email?: string | null;
    } | null;
  } | null;
  error?: {
    message?: string;
  } | null;
};

type ApprovalEmailResult =
  | { ok: true; to: string }
  | { ok: false; error: string };

function sanitizeRedirectTo(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/superadmin")) return "/superadmin/professionisti";
  if (raw.startsWith("//")) return "/superadmin/professionisti";
  return raw;
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
  const professionalId = String(formData.get("professionalId") || "").trim();
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  if (!professionalId) {
    return NextResponse.json({ error: "professionalId mancante" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: professionalBefore, error: professionalReadError } = await admin
    .from("professionals")
    .select("id, owner_id, email, display_name, first_name, last_name, business_name, category, is_vet")
    .eq("id", professionalId)
    .single<ProfessionalBeforeRow>();

  if (professionalReadError || !professionalBefore) {
    return NextResponse.json(
      { error: professionalReadError?.message || "Professionista non trovato" },
      { status: 404 }
    );
  }

  const { error } = await admin
    .from("professionals")
    .update({
      approved: true,
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      verified_by_user_id: user.id,
      rejection_reason: null,
    })
    .eq("id", professionalId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const syncResult = await syncProfessionalAuth(professionalId);

  if (!syncResult.ok) {
    await writeAdminAuditLog({
      adminId: user.id,
      action: "professional_approved_sync_failed",
      targetType: "professional",
      targetId: professionalId,
      meta: {
        redirectTo,
        sync_ok: false,
        sync_result: syncResult,
      },
    });

    return NextResponse.json(
      {
        error: `Professionista aggiornato, ma sync Auth fallita: ${syncResult.error}`,
      },
      { status: 500 }
    );
  }

  const displayName =
    professionalBefore.display_name ||
    [professionalBefore.first_name, professionalBefore.last_name].filter(Boolean).join(" ").trim() ||
    professionalBefore.business_name ||
    "Professionista";

  let email = "";

  if (professionalBefore.owner_id) {
    const authUserData = (await admin.auth.admin.getUserById(
      professionalBefore.owner_id
    )) as AuthUserByIdResponse;

    if (!authUserData.error && authUserData?.data?.user?.email) {
      email = String(authUserData.data.user.email).trim().toLowerCase();
    }
  }

  if (!email) {
    email = String(professionalBefore.email || "").trim().toLowerCase();
  }

  let emailResult: ApprovalEmailResult = email
    ? { ok: true, to: email }
    : { ok: false, error: "Email professionista assente sia nel profilo sia in Auth" };

  if (email) {
    try {
      await sendProfessionalApprovedEmail({
        to: email,
        displayName,
        businessName: professionalBefore.business_name,
        category: professionalBefore.category,
        isVet: professionalBefore.is_vet === true,
      });

      console.log("[professional_approved_email] sent", {
        professionalId,
        email,
      });

      emailResult = { ok: true, to: email };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Errore invio email approvazione";
      console.error("[professional_approved_email] failed", {
        professionalId,
        email,
        error: message,
      });

      emailResult = {
        ok: false,
        error: message,
      };
    }
  } else {
    console.error("[professional_approved_email] skipped", {
      professionalId,
      error: "Email professionista assente sia nel profilo sia in Auth",
    });
  }

  await writeAdminAuditLog({
    adminId: user.id,
    action: "professional_approved",
    targetType: "professional",
    targetId: professionalId,
    meta: {
      redirectTo,
      sync_ok: true,
      sync_result: syncResult,
      approval_email: emailResult,
    },
  });

  if (!emailResult.ok) {
    return NextResponse.json(
      {
        error: `Professionista approvato e sincronizzato, ma email non inviata: ${emailResult.error}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(new URL(redirectTo, req.url), 303);
}