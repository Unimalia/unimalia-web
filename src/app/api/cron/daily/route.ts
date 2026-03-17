import { createClient } from "@supabase/supabase-js";
import { resend, EMAIL_FROM_NO_REPLY, getBaseUrl } from "@/lib/email/resend";
import { askIfFoundEmail, expiringSoonEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

function isAuthorized(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const got = req.headers.get("x-cron-secret");
  return got === expected;
}

function utcTodayISODate() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoDateFromUTC(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateIso: string, days: number) {
  const d = new Date(dateIso);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDateFromUTC(d);
}

function subDays(dateIso: string, days: number) {
  const d = new Date(dateIso);
  d.setUTCDate(d.getUTCDate() - days);
  return isoDateFromUTC(d);
}

type ReminderRow = {
  id: string;
  animal_id: string;
  title: string;
  kind: "vaccine" | "visit" | "exam" | "other";
  due_date: string;
  remind_days_before: number;
  recipient_email: string;
  status: "scheduled" | "sent" | "cancelled";
};

type ReportRow = {
  id: string;
  title: string;
  contact_email: string;
  email_verified: boolean;
  status: string;
  created_at: string;
  expires_at: string | null;
  claim_token: string;
};

async function alreadySent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  reportId: string,
  kind: string
) {
  const { data, error } = await supabase
    .from("report_email_logs")
    .select("id")
    .eq("report_id", reportId)
    .eq("kind", kind)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function markSent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  reportId: string,
  kind: string
) {
  const { error } = await supabase.from("report_email_logs").insert({
    report_id: reportId,
    kind,
  });

  if (error) throw new Error(error.message);
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const todayISO = utcTodayISODate();
    const baseUrl = getBaseUrl();

    // ====== ANIMAL REMINDERS ======
    const { data: reminders, error: rErr } = await supabase
      .from("animal_reminders")
      .select("id,animal_id,title,kind,due_date,remind_days_before,recipient_email,status")
      .eq("status", "scheduled");

    if (rErr) throw new Error(rErr.message);

    let animalSent = 0;
    let animalSkipped = 0;
    const animalErrors: Array<{ id: string; error: string }> = [];

    for (const r of (reminders ?? []) as ReminderRow[]) {
      try {
        const due = new Date(`${r.due_date}T00:00:00.000Z`);
        const daysBefore =
          typeof r.remind_days_before === "number" ? r.remind_days_before : 7;
        const sendAt = new Date(due.getTime() - daysBefore * 86400000);
        const sendISO = isoDateFromUTC(sendAt);

        if (sendISO !== todayISO) {
          animalSkipped++;
          continue;
        }

        await resend.emails.send({
          from: EMAIL_FROM_NO_REPLY,
          to: r.recipient_email,
          subject: `Promemoria: ${r.title}`,
          html: `
            <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
              <h2 style="margin:0 0 8px">Promemoria UNIMALIA</h2>
              <p style="margin:0 0 12px"><b>${r.title}</b></p>
              <p style="margin:0 0 12px">Scadenza: <b>${r.due_date}</b></p>
              <p style="margin:0;color:#666;font-size:13px">Animale: ${r.animal_id}</p>
              <p style="margin:12px 0 0;color:#666;font-size:12px">
                Ricevi questo promemoria perch&eacute; &egrave; stato impostato ${daysBefore} giorno/i prima della scadenza.
              </p>
            </div>
          `,
        });

        const { error: uErr } = await supabase
          .from("animal_reminders")
          .update({ status: "sent", last_sent_at: new Date().toISOString() })
          .eq("id", r.id);

        if (uErr) throw new Error(uErr.message);

        animalSent++;
      } catch (e: any) {
        animalErrors.push({ id: r.id, error: e?.message || String(e) });
      }
    }

    // ====== REPORT REMINDERS ======
    const { data: reports, error: repErr } = await supabase
      .from("reports")
      .select("id,title,contact_email,email_verified,status,created_at,expires_at,claim_token")
      .eq("status", "active")
      .eq("email_verified", true);

    if (repErr) throw new Error(repErr.message);

    let reportSent = 0;
    let reportSkipped = 0;
    const reportErrors: Array<{ id: string; error: string }> = [];

    for (const report of (reports ?? []) as ReportRow[]) {
      try {
        if (!report.contact_email || !report.claim_token) {
          reportSkipped++;
          continue;
        }

        const closeFoundUrl = `${baseUrl}/azione/chiudi-ritrovato/${report.claim_token}`;
        const keepActiveUrl = `${baseUrl}/azione/ancora-smarrito/${report.claim_token}`;

        const createdDay = isoDateFromUTC(new Date(report.created_at));
        const day7 = addDays(createdDay, 7);
        const day30 = addDays(createdDay, 30);
        const expiresAtDay = report.expires_at
          ? isoDateFromUTC(new Date(report.expires_at))
          : null;
        const expiringSoonDay = expiresAtDay ? subDays(expiresAtDay, 7) : null;

        if (todayISO === day7) {
          const kind = "ask_found_7";
          if (!(await alreadySent(supabase, report.id, kind))) {
            const email = askIfFoundEmail({
              reportTitle: report.title,
              closeFoundUrl,
              keepActiveUrl,
            });

            await resend.emails.send({
              from: EMAIL_FROM_NO_REPLY,
              to: report.contact_email,
              subject: email.subject,
              html: email.html,
            });

            await markSent(supabase, report.id, kind);
            reportSent++;
            continue;
          }
        }

        if (todayISO === day30) {
          const kind = "ask_found_30";
          if (!(await alreadySent(supabase, report.id, kind))) {
            const email = askIfFoundEmail({
              reportTitle: report.title,
              closeFoundUrl,
              keepActiveUrl,
            });

            await resend.emails.send({
              from: EMAIL_FROM_NO_REPLY,
              to: report.contact_email,
              subject: email.subject,
              html: email.html,
            });

            await markSent(supabase, report.id, kind);
            reportSent++;
            continue;
          }
        }

        if (expiringSoonDay && todayISO === expiringSoonDay) {
          const kind = "expiring_7_days";
          if (!(await alreadySent(supabase, report.id, kind))) {
            const email = expiringSoonEmail({
              reportTitle: report.title,
              manageUrl: keepActiveUrl,
              daysLeft: 7,
            });

            await resend.emails.send({
              from: EMAIL_FROM_NO_REPLY,
              to: report.contact_email,
              subject: email.subject,
              html: email.html,
            });

            await markSent(supabase, report.id, kind);
            reportSent++;
            continue;
          }
        }

        reportSkipped++;
      } catch (e: any) {
        reportErrors.push({ id: report.id, error: e?.message || String(e) });
      }
    }

    return Response.json({
      ok: true,
      today: todayISO,
      animalReminders: {
        totalScheduled: (reminders ?? []).length,
        sent: animalSent,
        skipped: animalSkipped,
        errors: animalErrors,
      },
      reportReminders: {
        totalActive: (reports ?? []).length,
        sent: reportSent,
        skipped: reportSkipped,
        errors: reportErrors,
      },
    });
  } catch (e: any) {
    console.log("/api/cron/daily error:", e?.message ?? e);
    return new Response(`Cron error: ${e?.message ?? "unknown"}`, {
      status: 500,
    });
  }
}