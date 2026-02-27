// src/app/api/reminders/create/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
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
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, reminder: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore server" }, { status: 500 });
  }
}