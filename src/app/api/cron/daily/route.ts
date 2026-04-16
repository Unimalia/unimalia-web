import { createClient } from "@supabase/supabase-js";
import { resend, EMAIL_FROM_NO_REPLY } from "@/lib/email/resend";

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
  return d.toISOString().slice(0, 10);
}

function isoDateFromUTC(d: Date) {
  return d.toISOString().slice(0, 10);
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

export async function POST(req: Request) {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (!isAuthorized(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const todayISO = utcTodayISODate();

    const { data: reminders, error: rErr } = await supabase
      .from("animal_reminders")
      .select("id,animal_id,title,kind,due_date,remind_days_before,recipient_email,status")
      .eq("status", "scheduled");

    if (rErr) throw new Error(rErr.message);

    let animalSent = 0;
    let animalSkipped = 0;

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
          html: `<p>${r.title} - ${r.due_date}</p>`,
        });

        await supabase
          .from("animal_reminders")
          .update({ status: "sent", last_sent_at: new Date().toISOString() })
          .eq("id", r.id);

        animalSent++;
      } catch {
        continue;
      }
    }

    return Response.json({
      ok: true,
      today: todayISO,
      animalSent,
      animalSkipped,
    });
  } catch {
    return new Response("Cron error", { status: 500 });
  }
}
