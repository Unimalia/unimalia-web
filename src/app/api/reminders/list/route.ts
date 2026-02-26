import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const animalId = searchParams.get("animalId");

  if (!animalId) {
    return NextResponse.json({ error: "Missing animalId" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("animal_reminders")
    .select("id, animal_id, type, title, due_date, status, created_at")
    .eq("animal_id", animalId)
    .neq("status", "cancelled")
    .order("due_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reminders: data ?? [] });
}