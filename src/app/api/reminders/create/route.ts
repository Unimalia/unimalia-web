// src/app/api/reminders/create/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CreateReminderBody = {
  animalId?: string;
  animal_id?: string;
  type?: string;
  title?: string | null;
  due_date?: string | null;
  status?: string;
};

type AnimalReminderRow = {
  id: string;
  animal_id: string;
  type: string | null;
  title: string | null;
  due_date: string | null;
  status: string | null;
  created_at?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as CreateReminderBody;
    const animalId = String(body?.animalId || body?.animal_id || "").trim();

    if (!animalId) {
      return NextResponse.json({ error: "animalId mancante" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const payload = {
      animal_id: animalId,
      type: body?.type ?? "generic",
      title: body?.title ?? null,
      due_date: body?.due_date ?? null,
      status: body?.status ?? "active",
    };

    const { data, error } = await admin
      .from("animal_reminders")
      .insert(payload)
      .select("*")
      .single<AnimalReminderRow>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, reminder: data }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore server" },
      { status: 500 }
    );
  }
}
