import { NextResponse } from "next/server";
import { resend, EMAIL_FROM_NO_REPLY } from "@/lib/email/resend";

export async function GET() {
  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM_NO_REPLY,
      to: "valentinotwister@hotmail.it",
      subject: "Promemoria vaccino UNIMALIA",
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#18181b;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
            <div style="padding:24px 24px 8px 24px;">
              <div style="font-size:12px;font-weight:700;letter-spacing:.08em;color:#71717a;text-transform:uppercase;">
                UNIMALIA
              </div>
              <h1 style="margin:12px 0 8px 0;font-size:22px;line-height:1.3;color:#111827;">
                Promemoria vaccino per Luna
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46;">
                Ti ricordiamo che è previsto un richiamo vaccinale per <strong>Luna</strong>.
              </p>
            </div>

            <div style="padding:16px 24px;">
              <div style="border:1px solid #e4e4e7;border-radius:12px;padding:16px;background:#fafafa;">
                <div style="font-size:13px;color:#71717a;margin-bottom:8px;">Dettagli</div>
                <div style="font-size:15px;line-height:1.8;color:#18181b;">
                  <div><strong>Vaccini:</strong> Rabbia, Trivalente (RCP)</div>
                  <div><strong>Data richiamo:</strong> 25/03/2026</div>
                  <div><strong>Clinica di riferimento:</strong> Clinica Veterinaria Demo</div>
                </div>
              </div>
            </div>

            <div style="padding:8px 24px 0 24px;">
              <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#3f3f46;">
                Se la tua clinica offre la prenotazione online, potrai prenotare direttamente dal promemoria.
                In alternativa, contatta la struttura per fissare l'appuntamento.
              </p>
            </div>

            <div style="padding:8px 24px 24px 24px;">
              <a
                href="https://unimalia.it"
                style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;margin-right:8px;"
              >
                Prenota
              </a>

              <a
                href="tel:+390000000000"
                style="display:inline-block;padding:12px 18px;background:#ffffff;color:#111827;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #d4d4d8;"
              >
                Chiama per prenotare
              </a>
            </div>

            <div style="border-top:1px solid #e4e4e7;padding:16px 24px;background:#fafafa;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">
                Questo promemoria è stato inviato da UNIMALIA per aiutarti a gestire i richiami sanitari del tuo animale.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}