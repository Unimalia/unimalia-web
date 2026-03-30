import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isUuid } from "@/lib/server/validators";

type ConsultRequestRow = {
  id: string;
  professional_id: string;
  status: string | null;
};

function supabaseAnon(authHeader: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

async function requireUser(authHeader: string | null) {
  const sb = supabaseAnon(authHeader);
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

function isAllowedTargetStatus(value: string): value is "accepted" | "rejected" | "expired" {
  return value === "accepted" || value === "rejected" || value === "expired";
}

function canTransition(currentStatus: string | null) {
  return currentStatus === "pending";
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization");
  const user = await requireUser(authHeader);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const statusRaw = typeof body?.status === "string" ? body.status.trim() : "";

  if (!isAllowedTargetStatus(statusRaw)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const nextStatus = statusRaw;
  const sb = supabaseAnon(authHeader);

  const { data: currentRow, error: readError } = await sb
    .from("consult_requests")
    .select("id, professional_id, status")
    .eq("id", id)
    .maybeSingle<ConsultRequestRow>();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 400 });
  }

  if (!currentRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (currentRow.professional_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!canTransition(currentRow.status)) {
    return NextResponse.json({ error: "Invalid state transition" }, { status: 409 });
  }

  const { data: updatedRows, error: updateError } = await sb
    .from("consult_requests")
    .update({ status: nextStatus })
    .eq("id", id)
    .eq("professional_id", user.id)
    .eq("status", currentRow.status)
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json({ error: "Invalid state transition" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}