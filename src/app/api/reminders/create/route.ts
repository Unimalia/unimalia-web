import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

type Body = {
  animalId: string;
  kind: "vaccine" | "visit" | "exam" | "other";
  title: string;
  dueDate: string; // YYYY-MM-DD
  remindDaysBefore?: number;
  recipientEmail: string;
};

function isISODate(d: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>;

    if (!body.animalId) return NextResponse.json({ ok: false, error: "animalId required" }, { status: 400 });
    if (!body.kind) return NextResponse.json({ ok: false, error: "kind required" }, { status: 400 });
    if (!body.title) return NextResponse.json({ ok: false, error: "title required" }, { status: 400 });
    if (!body.dueDate || !isISODate(body.dueDate))
      return NextResponse.json({ ok: false, error: "dueDate must be YYYY-MM-DD" }, { status: 400 });
    if (!body.recipientEmail)
      return NextResponse.json({ ok: false, error: "recipientEmail required" }, { status: 400 });

    const remindDaysBefore =
      typeof body.remindDaysBefore === "number" && Number.isFinite(body.remindDaysBefore)
        ? Math.max(0, Math.min(365, Math.floor(body.remindDaysBefore)))
        : 7;

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("animal_reminders")
      .insert({
        animal_id: body.animalId,
        kind: body.kind,
        title: body.title,
        due_date: body.dueDate,
        remind_days_before: remindDaysBefore,
        channel: "email",
        recipient_email: body.recipientEmail,
        status: "scheduled",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}