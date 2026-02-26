import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const animalId = body?.animalId as string | undefined;
  const type = body?.type as string | undefined;
  const title = body?.title as string | undefined;
  const dueDate = body?.dueDate as string | undefined; // ISO date or timestamptz

  if (!animalId || !type || !title || !dueDate) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("animal_reminders")
    .insert({
      animal_id: animalId,
      type,
      title,
      due_date: dueDate,
      status: "active",
    })
    .select("id, animal_id, type, title, due_date, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reminder: data });
}