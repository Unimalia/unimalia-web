import { NextResponse } from "next/server";
import { resend, EMAIL_FROM_NO_REPLY } from "@/lib/email/resend";

export async function GET() {
  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM_NO_REPLY,
      to: "valentinotwister@hotmail.it",
      subject: "Test email UNIMALIA",
      html: "<b>Se leggi questa mail, Resend funziona.</b>",
    });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}