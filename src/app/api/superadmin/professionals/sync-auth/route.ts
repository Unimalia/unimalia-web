import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { isAdminUser } from "@/lib/adminAccess";
import { syncProfessionalAuth } from "@/lib/syncProfessionalAuth";
import { writeAdminAuditLog } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

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
  const redirectTo = String(formData.get("redirectTo") || "/superadmin/professionisti").trim();

  if (!professionalId) {
    return NextResponse.json({ error: "professionalId mancante" }, { status: 400 });
  }

  const syncResult = await syncProfessionalAuth(professionalId);

  await writeAdminAuditLog({
    adminId: user.id,
    action: "professional_sync_auth",
    targetType: "professional",
    targetId: professionalId,
    meta: {
      redirectTo,
      sync_ok: syncResult.ok,
      sync_result: syncResult,
    },
  });

  if (!syncResult.ok) {
    return NextResponse.json({ error: syncResult.error }, { status: 500 });
  }

  return NextResponse.redirect(new URL(redirectTo, req.url), 303);
}