import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";
import { getManagedAnimals } from "@/lib/professionisti/getManagedAnimals";

export const dynamic = "force-dynamic";

export async function GET() {
  const nowIso = new Date().toISOString();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) {
    return NextResponse.json(
      { ok: false, step: "auth.getUser", error: authErr.message },
      { status: 401 }
    );
  }
  if (!user) {
    return NextResponse.json({ ok: false, step: "auth.getUser", error: "Not authenticated" }, { status: 401 });
  }

  const orgId = await getProfessionalOrgId();

  // 1) grants attivi (schema corretto: grantee_type/grantee_id/valid_to)
  const { data: grantsActive, error: grantsErr } = await supabase
    .from("animal_access_grants")
    .select("id, animal_id, grantee_type, grantee_id, status, valid_to, revoked_at, created_at")
    .eq("grantee_type", "org")
    .eq("grantee_id", orgId ?? "")
    .is("revoked_at", null)
    .or(`valid_to.is.null,valid_to.gt.${nowIso}`);

  // 2) prova lettura animals via ADMIN (bypass RLS) SOLO sugli id autorizzati
  let animalsByAdmin: any[] = [];
  let animalsByAdminError: string | null = null;

  try {
    const animalIds = Array.from(new Set((grantsActive ?? []).map((g: any) => g.animal_id).filter(Boolean)));

    if (animalIds.length > 0) {
      const admin = supabaseAdmin();
      const { data, error } = await admin
        .from("animals")
        .select("id, name, species, chip_number, owner_id, status")
        .in("id", animalIds);

      if (error) animalsByAdminError = error.message;
      animalsByAdmin = data ?? [];
    }
  } catch (e: any) {
    animalsByAdminError = e?.message ?? String(e);
  }

  // 3) chiamata “vera” usata dalla pagina /professionisti/animali
  let managedAnimals: any[] = [];
  let managedAnimalsError: string | null = null;

  try {
    managedAnimals = await getManagedAnimals("");
  } catch (e: any) {
    managedAnimalsError = e?.message ?? String(e);
  }

  return NextResponse.json({
    nowIso,
    user: { id: user.id, email: user.email },
    orgId_from_getProfessionalOrgId: orgId ?? null,

    grants_active: {
      ok: !grantsErr,
      count: (grantsActive ?? []).length,
      error: grantsErr?.message ?? null,
      sample: (grantsActive ?? []).slice(0, 3),
    },

    animals_by_admin: {
      ok: !animalsByAdminError,
      count: animalsByAdmin.length,
      error: animalsByAdminError,
      sample: animalsByAdmin.slice(0, 3),
    },

    getManagedAnimals_result: {
      ok: !managedAnimalsError,
      count: managedAnimals.length,
      error: managedAnimalsError,
      sample: managedAnimals.slice(0, 3),
    },
  });
}