import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { isUuid } from "@/lib/server/validators";

type Action = "approve" | "reject" | "block" | "revoke";
type Duration = "24h" | "7d" | "6m" | "forever";

type OrganizationRow = {
  id: string;
  name: string | null;
  display_name: string | null;
  ragione_sociale: string | null;
  legal_name: string | null;
};

type ProfessionalRow = {
  id: string;
  display_name: string | null;
  business_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type AnimalRow = {
  id: string;
  name: string | null;
};

type AccessRequestRow = {
  id: string;
  created_at: string;
  animal_id: string;
  owner_id: string;
  org_id: string;
  status: string;
  requested_scope: unknown;
};

type AccessGrantLookupRow = {
  id: string;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFoundResponse() {
  return NextResponse.json(
    { error: "Not found" },
    {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function isValidAction(value: string): value is Action {
  return value === "approve" || value === "reject" || value === "block" || value === "revoke";
}

function isValidDuration(value: string): value is Duration {
  return value === "24h" || value === "7d" || value === "6m" || value === "forever";
}

function computeValidTo(duration: Duration) {
  const now = new Date();

  if (duration === "forever") return null;
  if (duration === "24h") now.setHours(now.getHours() + 24);
  if (duration === "7d") now.setDate(now.getDate() + 7);
  if (duration === "6m") now.setMonth(now.getMonth() + 6);

  return now.toISOString();
}

async function tryResolveOrgNames(admin: ReturnType<typeof supabaseAdmin>, orgIds: string[]) {
  const orgNameById = new Map<string, string>();

  if (!orgIds.length) return orgNameById;

  try {
    const { data, error } = await admin
      .from("organizations")
      .select("id, name, display_name, ragione_sociale, legal_name")
      .in("id", orgIds);

    if (!error) {
      for (const row of (data ?? []) as OrganizationRow[]) {
        orgNameById.set(
          row.id,
          row.display_name ??
            row.name ??
            row.ragione_sociale ??
            row.legal_name ??
            row.id
        );
      }

      if (orgNameById.size > 0) return orgNameById;
    }
  } catch {}

  try {
    const { data, error } = await admin
      .from("professionals")
      .select("id, display_name, business_name, first_name, last_name")
      .in("id", orgIds);

    if (!error) {
      for (const row of (data ?? []) as ProfessionalRow[]) {
        const fullName = [row.first_name?.trim() ?? "", row.last_name?.trim() ?? ""]
          .filter(Boolean)
          .join(" ");

        const name =
          row.display_name ??
          row.business_name ??
          fullName ??
          row.id;

        orgNameById.set(row.id, name || row.id);
      }
    }
  } catch {}

  return orgNameById;
}

function normalizeRequestedScope(input: unknown): Array<"read" | "write"> {
  const raw = Array.isArray(input) ? input : [];
  const filtered = raw
    .map((item) => String(item).trim().toLowerCase())
    .filter((item): item is "read" | "write" => item === "read" || item === "write");

  return Array.from(new Set(filtered));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const animalId = String(url.searchParams.get("animalId") || "").trim();

    if (animalId && !isUuid(animalId)) {
      return notFoundResponse();
    }

    const supabase = await createServerSupabaseClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return notFoundResponse();
    }

    let q = admin
      .from("animal_access_requests")
      .select("id, created_at, animal_id, owner_id, org_id, status, requested_scope")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (animalId) {
      q = q.eq("animal_id", animalId);
    }

    const { data, error } = await q;

    if (error) {
      return NextResponse.json(
        { error: "Server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const rows = (data ?? []) as AccessRequestRow[];

    const animalIds = Array.from(new Set(rows.map((r) => r.animal_id).filter(Boolean)));
    const orgIds = Array.from(new Set(rows.map((r) => r.org_id).filter(Boolean)));

    const animalNameById = new Map<string, string>();

    if (animalIds.length) {
      const { data: animals, error: animalsErr } = await admin
        .from("animals")
        .select("id, name")
        .in("id", animalIds);

      if (animalsErr) {
        return NextResponse.json(
          { error: "Server error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      for (const a of (animals ?? []) as AnimalRow[]) {
        animalNameById.set(a.id, a.name ?? a.id);
      }
    }

    const orgNameById = await tryResolveOrgNames(admin, orgIds);

    const enriched = rows.map((r) => ({
      ...r,
      expires_at: null,
      animal_name: animalNameById.get(r.animal_id) ?? r.animal_id,
      org_name: orgNameById.get(r.org_id) ?? r.org_id,
    }));

    return NextResponse.json(
      { rows: enriched },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return notFoundResponse();
    }

    const body = await req.json().catch(() => null);

    if (!isObjectRecord(body)) {
      return notFoundResponse();
    }

    if (!body.id || !body.action) {
      return notFoundResponse();
    }

    const id = String(body.id).trim();
    const actionRaw = String(body.action).trim();

    if (!isUuid(id)) {
      return notFoundResponse();
    }

    if (!isValidAction(actionRaw)) {
      return notFoundResponse();
    }

    const action: Action = actionRaw;
    const durationRaw = body.duration ? String(body.duration).trim() : "7d";
    const duration: Duration = isValidDuration(durationRaw) ? durationRaw : "7d";

    const { data: reqRow, error: reqErr } = await admin
      .from("animal_access_requests")
      .select("id, animal_id, owner_id, org_id, status, requested_scope")
      .eq("id", id)
      .maybeSingle();

    if (reqErr) {
      return NextResponse.json(
        { error: "Server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const requestRow = reqRow as AccessRequestRow | null;

    if (!requestRow) {
      return notFoundResponse();
    }

    if (requestRow.owner_id !== user.id) {
      return notFoundResponse();
    }

    if (!requestRow.animal_id || !isUuid(String(requestRow.animal_id))) {
      return notFoundResponse();
    }

    if (action === "approve") {
      const validTo = computeValidTo(duration);
      const requestedScope = normalizeRequestedScope(requestRow.requested_scope);

      if (requestedScope.length === 0) {
        return notFoundResponse();
      }

      const { data: existingGrant, error: existingGrantErr } = await admin
        .from("animal_access_grants")
        .select("id")
        .eq("animal_id", requestRow.animal_id)
        .eq("grantee_type", "organization")
        .eq("grantee_id", requestRow.org_id)
        .is("revoked_at", null)
        .maybeSingle();

      if (existingGrantErr) {
        return NextResponse.json(
          { error: "Server error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      const existingGrantRow = existingGrant as AccessGrantLookupRow | null;

      const grantPayload = {
        granted_by_user_id: user.id,
        scope_read: requestedScope.includes("read"),
        scope_write: requestedScope.includes("write"),
        scope_upload: false,
        purpose: "owner_approved_request",
        valid_from: new Date().toISOString(),
        valid_to: validTo,
        status: "active",
        revoked_at: null,
        revoked_by_user_id: null,
      };

      if (existingGrantRow?.id) {
        const { error: updGrantErr } = await admin
          .from("animal_access_grants")
          .update(grantPayload)
          .eq("id", existingGrantRow.id);

        if (updGrantErr) {
          return NextResponse.json(
            { error: "Server error" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
          );
        }
      } else {
        const { error: grantErr } = await admin.from("animal_access_grants").insert({
          animal_id: requestRow.animal_id,
          grantee_type: "organization",
          grantee_id: requestRow.org_id,
          ...grantPayload,
        });

        if (grantErr) {
          return NextResponse.json(
            { error: "Server error" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
          );
        }
      }

      const { error: updErr } = await admin
        .from("animal_access_requests")
        .update({
          status: "approved",
        })
        .eq("id", id)
        .eq("owner_id", user.id);

      if (updErr) {
        return NextResponse.json(
          { error: "Server error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      return NextResponse.json(
        {
          ok: true,
          status: "approved",
          expires_at: validTo,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "reject") {
      const { error: updErr } = await admin
        .from("animal_access_requests")
        .update({
          status: "rejected",
        })
        .eq("id", id)
        .eq("owner_id", user.id);

      if (updErr) {
        return NextResponse.json(
          { error: "Server error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      return NextResponse.json(
        { ok: true, status: "rejected" },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "block") {
      const { error: updErr } = await admin
        .from("animal_access_requests")
        .update({
          status: "blocked",
        })
        .eq("id", id)
        .eq("owner_id", user.id);

      if (updErr) {
        return NextResponse.json(
          { error: "Server error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      return NextResponse.json(
        { ok: true, status: "blocked" },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "revoke") {
      const { error: revErr } = await admin
        .from("animal_access_grants")
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by_user_id: user.id,
          status: "revoked",
        })
        .eq("animal_id", requestRow.animal_id)
        .eq("grantee_type", "organization")
        .eq("grantee_id", requestRow.org_id)
        .is("revoked_at", null);

      if (revErr) {
        return NextResponse.json(
          { error: "Server error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      const { error: updErr } = await admin
        .from("animal_access_requests")
        .update({
          status: "revoked",
        })
        .eq("id", id)
        .eq("owner_id", user.id);

      if (updErr) {
        return NextResponse.json(
          { error: "Server error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      return NextResponse.json(
        { ok: true, status: "revoked" },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    return notFoundResponse();
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}