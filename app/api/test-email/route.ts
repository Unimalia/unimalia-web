import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const result = await resend.emails.send({
      from: "UNIMALIA <no-reply@unimalia.it>",
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