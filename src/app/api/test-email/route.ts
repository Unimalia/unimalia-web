import { NextResponse } from "next/server";
import { sendProfessionalApprovedEmail } from "@/lib/email/sendProfessionalApprovedEmail";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await sendProfessionalApprovedEmail({
      to: "valentinomct@gmail.com",
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