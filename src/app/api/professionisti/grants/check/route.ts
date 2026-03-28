import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  supabaseAdmin,
} from "@/lib/supabase/server";
import { isUuid } from "@/lib/server/validators";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const animalId = String(url.searchParams.get("animal_id") || "").trim();

    if (!animalId) {
      return NextResponse.json(
        { ok: false, hasGrant: false, error: "Missing animal_id" },
        { status: 400 }
      );
    }

    if (!isUuid(animalId)) {
      return NextResponse.json(
        { ok: false, hasGrant: false, error: "Invalid animal_id" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const admin = supabaseAdmin();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr) {
      return NextResponse.json(
        { ok: false, hasGrant: false, error: authErr.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, hasGrant: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const candidateIds = new Set<string>();

    const profileResult = await admin
      .from("professional_profiles")
      .select("user_id, org_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileResult.error) {
      return NextResponse.json(
        {
          ok: false,
          hasGrant: false,
          error: profileResult.error.message,
        },
        { status: 500 }
      );
    }

    const profileOrgId = (profileResult.data as any)?.org_id ?? null;
    if (profileOrgId) candidateIds.add(String(profileOrgId));

    const professionalResult = await admin
      .from("professionals")
      .select("id, owner_id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (professionalResult.error) {
      return NextResponse.json(
        {
          ok: false,
          hasGrant: false,
          error: professionalResult.error.message,
        },
        { status: 500 }
      );
    }

    const professionalId = (professionalResult.data as any)?.id ?? null;
    if (professionalId) candidateIds.add(String(professionalId));

    const ids = Array.from(candidateIds);

    if (ids.length === 0) {
      return NextResponse.json({
        ok: true,
        hasGrant: false,
        reason: "missing_professional_context",
      });
    }

    const { data: grants, error: grantError } = await admin
      .from("animal_access_grants")
      .select(
        "id, grantee_id, grantee_type, status, valid_from, valid_to, revoked_at, scope_read, scope_write, scope_upload"
      )
      .eq("animal_id", animalId)
      .eq("grantee_type", "organization")
      .in("grantee_id", ids)
      .is("revoked_at", null);

    if (grantError) {
      return NextResponse.json(
        { ok: false, hasGrant: false, error: grantError.message },
        { status: 500 }
      );
    }

    const now = Date.now();

    const activeGrant =
      (grants ?? []).find((g: any) => {
        if (g.grantee_type !== "organization") return false;
        if (g.status !== "active" && g.status !== "approved") return false;
        if (!g.scope_read && !g.scope_write && !g.scope_upload) return false;

        if (g.valid_from) {
          const validFromMs = new Date(g.valid_from).getTime();
          if (!Number.isNaN(validFromMs) && validFromMs > now) return false;
        }

        if (!g.valid_to) return true;

        const validToMs = new Date(g.valid_to).getTime();
        if (Number.isNaN(validToMs)) return false;

        return validToMs > now;
      }) ?? null;

    return NextResponse.json({
      ok: true,
      hasGrant: Boolean(activeGrant),
      matchedGranteeId: activeGrant?.grantee_id ?? null,
      checkedIds: ids,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        hasGrant: false,
        error:
          error instanceof Error ? error.message : "Errore verifica grant",
      },
      { status: 500 }
    );
  }
}