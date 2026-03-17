import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { isAdminUser } from "@/lib/adminAccess";
import { sendProfessionalApprovedEmail } from "@/lib/email/sendProfessionalApprovedEmail";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await supabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  try {
    await sendProfessionalApprovedEmail({
      to: user.email!,
      displayName: "Test UNIMALIA",
      isVet: true,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}