import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireVet(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1];

  if (!token) return { ok: false as const, status: 401, error: "Missing bearer token" };

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  const user = userData?.user;

  if (userErr || !user) return { ok: false as const, status: 401, error: "Invalid session" };

  const { data: pro, error: proErr } = await supabaseAdmin
    .from("professionals")
    .select("id,is_vet,approved,owner_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (proErr) return { ok: false as const, status: 500, error: proErr.message };
  if (!pro || pro.is_vet !== true) return { ok: false as const, status: 403, error: "Not a vet" };
  if (pro.approved === false) return { ok: false as const, status: 403, error: "Vet not approved" };

  return { ok: true as const, userId: user.id, professionalId: pro.id };
}

export async function GET(req: Request) {
  const vet = await requireVet(req);
  if (!vet.ok) return NextResponse.json({ error: vet.error }, { status: vet.status });

  const { searchParams } = new URL(req.url);
  const animalId = (searchParams.get("animalId") || "").trim();
  if (!animalId) return NextResponse.json({ error: "Missing animalId" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("animal_clinic_events")
    .select("id,animal_id,event_date,type,title,description,visibility,source,verified_at,verified_by,created_at")
    .eq("animal_id", animalId)
    .order("event_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, events: data ?? [] }, { status: 200 });
}