import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { isUuid } from "@/lib/server/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ animalId: string }>;
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

    if (!animal) {
      return notFoundResponse();
    }

    if (!animal.owner_id) {
      return notFoundResponse();
    }

    if (animal.owner_id !== user.id) {
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

    const requestRows = requests ?? [];
    const grantRows = (grants ?? []).filter((g: any) => g.grantee_type === "org");

    const orgIdsFromRequests = requestRows
      .map((r: any) => r.org_id)
      .filter((v: unknown): v is string => typeof v === "string" && v.length > 0);

    const orgIdsFromGrants = grantRows
      .map((g: any) => g.grantee_id)
      .filter((v: unknown): v is string => typeof v === "string" && v.length > 0);

    const orgIds = Array.from(new Set([...orgIdsFromRequests, ...orgIdsFromGrants]));

    const orgNameById = new Map<string, string>();

    if (orgIds.length > 0) {
      const { data: orgs, error: orgErr } = await admin
        .from("organizations")
        .select("id, name, display_name, legal_name, ragione_sociale")
        .in("id", orgIds);

      if (orgErr) {
        return NextResponse.json(
          { error: "Server error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      for (const o of orgs ?? []) {
        orgNameById.set(
          o.id,
          (o as any).display_name ??
            (o as any).name ??
            (o as any).legal_name ??
            (o as any).ragione_sociale ??
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

        for (const p of professionals ?? []) {
          const label =
            (p as any).display_name ??
            (p as any).business_name ??
            [((p as any).first_name ?? "").trim(), ((p as any).last_name ?? "").trim()]
              .filter(Boolean)
              .join(" ") ??
            p.id;

          orgNameById.set(p.id, label || p.id);
        }
      }
    }

    const enrichedRequests = requestRows.map((r: any) => ({
      ...r,
      animal_name: animal.name ?? animal.id,
      org_name: orgNameById.get(r.org_id) ?? r.org_id,
    }));

    const enrichedGrants = grantRows.map((g: any) => ({
      ...g,
      animal_name: animal.name ?? animal.id,
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