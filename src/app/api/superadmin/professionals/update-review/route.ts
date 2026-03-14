import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminUser } from "@/lib/adminAccess";

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

  const verificationStatusRaw = String(formData.get("verification_status") || "").trim();
  const verificationLevelRaw = String(formData.get("verification_level") || "").trim();
  const rejectionReasonRaw = String(formData.get("rejection_reason") || "").trim();

  if (!professionalId) {
    return NextResponse.json({ error: "professionalId mancante" }, { status: 400 });
  }

  const verification_status = verificationStatusRaw || null;
  const verification_level = verificationLevelRaw || null;
  const rejection_reason = rejectionReasonRaw || null;

  const admin = supabaseAdmin();

  const { error } = await admin
    .from("professionals")
    .update({
      verification_status,
      verification_level,
      rejection_reason,
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("id", professionalId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL(redirectTo, req.url), 303);
}