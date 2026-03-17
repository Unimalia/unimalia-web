import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminUser } from "@/lib/adminAccess";
import { syncProfessionalAuth } from "@/lib/syncProfessionalAuth";
import { writeAdminAuditLog } from "@/lib/adminAudit";
import { sendProfessionalApprovedEmail } from "@/lib/email/sendProfessionalApprovedEmail";

export const dynamic = "force-dynamic";

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
    .select("id, email, display_name, first_name, last_name, business_name, is_vet")
    .eq("id", professionalId)
    .single();

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
      verified_by: user.id,
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

  const email = String(professionalBefore.email || "").trim().toLowerCase();

  let emailResult:
    | { ok: true }
    | { ok: false; error: string } = { ok: true };

  if (email) {
    try {
      await sendProfessionalApprovedEmail({
        to: email,
        displayName,
        isVet: professionalBefore.is_vet === true,
      });
    } catch (e: any) {
      emailResult = {
        ok: false,
        error: e?.message || "Errore invio email approvazione",
      };
    }
  } else {
    emailResult = {
      ok: false,
      error: "Email professionista assente",
    };
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

  return NextResponse.redirect(new URL(redirectTo, req.url), 303);
}