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

  return { ok: true as const, professionalId: pro.id };
}

export async function POST(req: Request) {
  const vet = await requireVet(req);
  if (!vet.ok) return NextResponse.json({ error: vet.error }, { status: vet.status });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const eventId = String(body?.eventId || "").trim();
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const patch = {
    source: "professional",
    verified_at: new Date().toISOString(),
    verified_by: vet.professionalId,
  };

  const { data, error } = await supabaseAdmin
    .from("animal_clinic_events")
    .update(patch)
    .eq("id", eventId)
    .select("id,source,verified_at,verified_by")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, event: data }, { status: 200 });
}