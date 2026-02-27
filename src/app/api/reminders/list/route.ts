// src/app/api/reminders/list/route.ts
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

    const admin = supabaseAdmin(); // ✅ IMPORTANTISSIMO

    const { data, error } = await admin
      .from("animal_reminders")
      .select("id, animal_id, type, title, due_date, status, created_at")
      .eq("animal_id", animalId)
      .neq("status", "cancelled")
      .order("due_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, reminders: data ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore server" }, { status: 500 });
  }
}