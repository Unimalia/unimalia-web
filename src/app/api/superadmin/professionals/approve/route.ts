import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminUser } from "@/lib/adminAccess";
import { syncProfessionalAuth } from "@/lib/syncProfessionalAuth";
import { writeAdminAuditLog } from "@/lib/adminAudit";

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

  const { error } = await admin
    .from("professionals")
    .update({
      approved: true,
      verification_status: "approved",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
      rejection_reason: null,
    })
    .eq("id", professionalId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const syncResult = await syncProfessionalAuth(professionalId);

  await writeAdminAuditLog({
    adminId: user.id,
    action: "professional_approved",
    targetType: "professional",
    targetId: professionalId,
    meta: {
      redirectTo,
      sync_ok: syncResult.ok,
      sync_result: syncResult,
    },
  });

  if (!syncResult.ok) {
    return NextResponse.json(
      {
        error: `Professionista aggiornato, ma sync Auth fallita: ${syncResult.error}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(new URL(redirectTo, req.url), 303);
}
