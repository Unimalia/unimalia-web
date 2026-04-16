import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  supabaseAdmin,
} from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import { isUuid } from "@/lib/server/validators";

type AnimalGrantRow = {
  id: string;
  grantee_id: string;
  grantee_type: string;
  status: string;
  valid_from: string | null;
  valid_to: string | null;
  revoked_at: string | null;
  scope_read: boolean | null;
  scope_write: boolean | null;
  scope_upload: boolean | null;
};

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

    const organizationId = await getProfessionalOrgId(user.id);

    if (!organizationId) {
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
      .eq("grantee_id", organizationId)
      .is("revoked_at", null)
      .returns<AnimalGrantRow[]>();

    if (grantError) {
      return NextResponse.json(
        { ok: false, hasGrant: false, error: grantError.message },
        { status: 500 }
      );
    }

    const now = Date.now();

    const activeGrant =
      (grants ?? []).find((g) => {
        if (g.grantee_type !== "organization") return false;
        if (g.status !== "active") return false;
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
      checkedIds: [organizationId],
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
