import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { isUuid } from "@/lib/server/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ animalId: string }>;
};

type AnimalRow = {
  id: string;
  owner_id: string | null;
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
  expires_at: string | null;
};

type AccessGrantRow = {
  id: string;
  created_at: string;
  animal_id: string;
  grantee_type: string;
  grantee_id: string;
  status: string;
  valid_from: string | null;
  valid_to: string | null;
  revoked_at: string | null;
  scope_read: boolean | null;
  scope_write: boolean | null;
  scope_upload: boolean | null;
};

type OrganizationRow = {
  id: string;
  name: string | null;
  display_name: string | null;
  legal_name: string | null;
};

type ProfessionalRow = {
  id: string;
  display_name: string | null;
  business_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

function notFoundResponse() {
  return NextResponse.json(
    { error: "Not found" },
    {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { animalId } = await ctx.params;

    if (!animalId || animalId === "undefined" || !isUuid(animalId)) {
      return notFoundResponse();
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return notFoundResponse();
    }

    const { data: animal, error: animalErr } = await supabase
      .from("animals")
      .select("id, owner_id, name")
      .eq("id", animalId)
      .maybeSingle();

    if (animalErr) {
      return NextResponse.json(
        { error: "Server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const animalRow = animal as AnimalRow | null;

    if (!animalRow) {
      return notFoundResponse();
    }

    if (!animalRow.owner_id) {
      return notFoundResponse();
    }

    if (animalRow.owner_id !== user.id) {
      return notFoundResponse();
    }

    const requestsQ = supabase
      .from("animal_access_requests")
      .select("id, created_at, animal_id, owner_id, org_id, status, requested_scope, expires_at")
      .eq("animal_id", animalId)
      .order("created_at", { ascending: false });

    const admin = supabaseAdmin();

    const grantsQ = admin
      .from("animal_access_grants")
      .select(
        "id, created_at, animal_id, grantee_type, grantee_id, status, valid_from, valid_to, revoked_at, scope_read, scope_write, scope_upload"
      )
      .eq("animal_id", animalId)
      .order("created_at", { ascending: false });

    const [{ data: requests, error: reqErr }, { data: grants, error: grantErr }] =
      await Promise.all([requestsQ, grantsQ]);

    if (reqErr || grantErr) {
      return NextResponse.json(
        { error: "Server error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const requestRows = (requests ?? []) as AccessRequestRow[];
    const grantRows = ((grants ?? []) as AccessGrantRow[]).filter(
      (g) => g.grantee_type === "organization"
    );

    const orgIdsFromRequests = requestRows
      .map((r) => r.org_id)
      .filter((v): v is string => typeof v === "string" && v.length > 0);

    const orgIdsFromGrants = grantRows
      .map((g) => g.grantee_id)
      .filter((v): v is string => typeof v === "string" && v.length > 0);

    const orgIds = Array.from(new Set([...orgIdsFromRequests, ...orgIdsFromGrants]));

    const orgNameById = new Map<string, string>();

    if (orgIds.length > 0) {
      const { data: orgs, error: orgErr } = await admin
        .from("organizations")
        .select("id, name, display_name, legal_name")
        .in("id", orgIds);

      if (orgErr) {
        return NextResponse.json(
          { error: "Server error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      for (const o of (orgs ?? []) as OrganizationRow[]) {
        orgNameById.set(
          o.id,
          o.display_name ??
            o.name ??
            o.legal_name ??
            o.id
        );
      }

      const missingIds = orgIds.filter((id) => !orgNameById.has(id));

      if (missingIds.length > 0) {
        const { data: professionals, error: professionalsErr } = await admin
          .from("professionals")
          .select("id, display_name, business_name, first_name, last_name")
          .in("id", missingIds);

        if (professionalsErr) {
          return NextResponse.json(
            { error: "Server error" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
          );
        }

        for (const p of (professionals ?? []) as ProfessionalRow[]) {
          const fullName = [p.first_name?.trim() ?? "", p.last_name?.trim() ?? ""]
            .filter(Boolean)
            .join(" ");

          const label =
            p.display_name ??
            p.business_name ??
            fullName ??
            p.id;

          orgNameById.set(p.id, label || p.id);
        }
      }
    }

    const enrichedRequests = requestRows.map((r) => ({
      ...r,
      animal_name: animalRow.name ?? animalRow.id,
      org_name: orgNameById.get(r.org_id) ?? r.org_id,
    }));

    const enrichedGrants = grantRows.map((g) => ({
      ...g,
      animal_name: animalRow.name ?? animalRow.id,
      org_name: orgNameById.get(g.grantee_id) ?? g.grantee_id,
    }));

    return NextResponse.json(
      {
        requests: enrichedRequests,
        grants: enrichedGrants,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}