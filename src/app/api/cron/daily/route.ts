import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

// Se usi Vercel Cron, puoi proteggere l'endpoint con un segreto
function isAuthorized(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  const got = req.headers.get("x-cron-secret");
  return got === expected;
}

function utcTodayISODate() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD
}

function isoDateFromUTC(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type ReminderRow = {
  id: string;
  animal_id: string;
  title: string;
  kind: "vaccine" | "visit" | "exam" | "other";
  due_date: string; // YYYY-MM-DD
  remind_days_before: number;
  recipient_email: string;
  status: "scheduled" | "sent" | "cancelled";
};

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) throw new Error("Missing RESEND_API_KEY");
    const resend = new Resend(resendKey);

    const todayISO = utcTodayISODate();

    // Prendiamo tutti i reminders schedulati
    const { data: reminders, error: rErr } = await supabase
      .from("animal_reminders")
      .select(
        "id,animal_id,title,kind,due_date,remind_days_before,recipient_email,status"
      )
      .eq("status", "scheduled");

    if (rErr) throw new Error(rErr.message);

    let sent = 0;
    let skipped = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const r of (reminders ?? []) as ReminderRow[]) {
      try {
        // Calcola data invio: due_date - remind_days_before
        const due = new Date(`${r.due_date}T00:00:00.000Z`);
        const daysBefore =
          typeof r.remind_days_before === "number" ? r.remind_days_before : 7;
        const sendAt = new Date(due.getTime() - daysBefore * 86400000);
        const sendISO = isoDateFromUTC(sendAt);

        if (sendISO !== todayISO) {
          skipped++;
          continue;
        }

        // Invia email
        await resend.emails.send({
          from: "UNIMALIA <no-reply@unimalia.it>",
          to: r.recipient_email,
          subject: `Promemoria: ${r.title}`,
          html: `
            <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
              <h2 style="margin:0 0 8px">Promemoria UNIMALIA</h2>
              <p style="margin:0 0 12px"><b>${r.title}</b></p>
              <p style="margin:0 0 12px">Scadenza: <b>${r.due_date}</b></p>
              <p style="margin:0;color:#666;font-size:13px">Animale: ${r.animal_id}</p>
              <p style="margin:12px 0 0;color:#666;font-size:12px">
                Ricevi questo promemoria perché è stato impostato ${daysBefore} giorno/i prima della scadenza.
              </p>
            </div>
          `,
        });

        // Marca come sent
        const { error: uErr } = await supabase
          .from("animal_reminders")
          .update({ status: "sent", last_sent_at: new Date().toISOString() })
          .eq("id", r.id);

        if (uErr) throw new Error(uErr.message);

        sent++;
      } catch (e: any) {
        errors.push({ id: r.id, error: e?.message || String(e) });
      }
    }

    return Response.json({
      ok: true,
      today: todayISO,
      totalScheduled: (reminders ?? []).length,
      sent,
      skipped,
      errors,
    });
  } catch (e: any) {
    console.log("❌ /api/cron/daily error:", e?.message ?? e);
    return new Response(`Cron error: ${e?.message ?? "unknown"}`, {
      status: 500,
    });
  }
}