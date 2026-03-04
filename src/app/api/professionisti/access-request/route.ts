import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const animalId = body?.animalId?.trim() || "";
  const microchip = body?.microchip?.trim() || "";

  let animal = null;

  // ✅ PRIORITÀ: animalId (funziona anche senza microchip)
  if (animalId) {
    const { data } = await supabase
      .from("animals")
      .select("id, owner_id")
      .eq("id", animalId)
      .maybeSingle();

    animal = data;
  }

  // fallback microchip
  if (!animal && microchip) {
    const { data } = await supabase
      .from("animals")
      .select("id, owner_id")
      .eq("chip_number", microchip)
      .maybeSingle();

    animal = data;
  }

  if (!animal) {
    return NextResponse.json({ error: "Animale non trovato" }, { status: 404 });
  }

  const { data: request, error } = await supabase
    .from("animal_access_requests")
    .insert({
      animal_id: animal.id,
      owner_id: animal.owner_id,
      requester_id: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    requestId: request.id,
  });
}