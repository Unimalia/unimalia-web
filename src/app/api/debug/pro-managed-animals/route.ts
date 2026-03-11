import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getProfessionalRefs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const refs = new Set<string>();
  refs.add(userId);

  const byUserId = await supabase
    .from("professional_profiles")
    .select("id, user_id, org_id")
    .eq("user_id", userId);

  const byId = await supabase
    .from("professional_profiles")
    .select("id, user_id, org_id")
    .eq("id", userId);

  for (const row of byUserId.data ?? []) {
    if (row.id) refs.add(row.id);
    if ((row as any).user_id) refs.add((row as any).user_id);
    if (row.org_id) refs.add(row.org_id);
  }

  for (const row of byId.data ?? []) {
    if (row.id) refs.add(row.id);
    if ((row as any).user_id) refs.add((row as any).user_id);
    if (row.org_id) refs.add(row.org_id);
  }

  return {
    refs: Array.from(refs).filter(Boolean),
    byUserId: {
      data: byUserId.data ?? [],
      error: byUserId.error
        ? {
            message: byUserId.error.message,
            details: byUserId.error.details,
            hint: byUserId.error.hint,
            code: byUserId.error.code,
          }
        : null,
    },
    byId: {
      data: byId.data ?? [],
      error: byId.error
        ? {
            message: byId.error.message,
            details: byId.error.details,
            hint: byId.error.hint,
            code: byId.error.code,
          }
        : null,
    },
  };
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          ok: false,
          step: "auth",
          error: authError?.message || "Non autenticato",
        },
        { status: 401 }
      );
    }

    const refsResult = await getProfessionalRefs(supabase, user.id);
    const refs = refsResult.refs;

    const grantsByRef: Record<string, any> = {};
    const animalsByRef: Record<string, any> = {};

    for (const ref of refs) {
      const grants = await supabase
        .from("animal_access_grants")
        .select("id, animal_id, grantee_id, status")
        .eq("grantee_id", ref)
        .eq("status", "active");

      grantsByRef[ref] = {
        count: grants.data?.length ?? 0,
        data: grants.data ?? [],
        error: grants.error
          ? {
              message: grants.error.message,
              details: grants.error.details,
              hint: grants.error.hint,
              code: grants.error.code,
            }
          : null,
      };

      const animals = await supabase
        .from("animals")
        .select(`
          id,
          name,
          species,
          microchip,
          owner_id,
          owner_claim_status,
          created_by_org_id,
          origin_org_id,
          created_by_role,
          unimalia_code
        `)
        .or(`created_by_org_id.eq.${ref},origin_org_id.eq.${ref}`);

      animalsByRef[ref] = {
        count: animals.data?.length ?? 0,
        data: animals.data ?? [],
        error: animals.error
          ? {
              message: animals.error.message,
              details: animals.error.details,
              hint: animals.error.hint,
              code: animals.error.code,
            }
          : null,
      };
    }

    return NextResponse.json({
      ok: true,
      auth: {
        userId: user.id,
        email: user.email ?? null,
      },
      professionalProfiles: refsResult,
      grantsByRef,
      animalsByRef,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        step: "unexpected",
        error: error?.message || "Errore interno",
      },
      { status: 500 }
    );
  }
}