import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";
import { getProfessionalOrgId } from "@/lib/professionisti/org";

export const dynamic = "force-dynamic";

async function tryQuery<T>(fn: () => Promise<{ data: T | null; error: any }>) {
  try {
    const { data, error } = await fn();
    return { ok: !error, data, error: error ? String(error.message ?? error) : null };
  } catch (e: any) {
    return { ok: false, data: null, error: String(e?.message ?? e) };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const animalId = url.searchParams.get("animal_id"); // opzionale
  const nowIso = new Date().toISOString();

  const supabase = await createServerSupabaseClient();
  const admin = supabaseAdmin();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 1) orgId "vera" (stessa della grants/check)
  const orgId = await getProfessionalOrgId();

  // 2) orgId dal profilo (così vediamo se sono diverse)
  const proProfileRes = await tryQuery(async () =>
    supabase
      .from("professional_profiles")
      .select("user_id, org_id")
      .eq("user_id", user.id)
      .maybeSingle()
  );

  // 3) grants con schema A: grantee_type/grantee_id
  const grantsByGrantee = orgId
    ? await tryQuery(async () =>
        admin
          .from("animal_access_grants")
          .select("id, animal_id, grantee_type, grantee_id, status, valid_from, valid_to, revoked_at, created_at")
          .eq("grantee_type", "org")
          .eq("grantee_id", orgId)
          .order("created_at", { ascending: false })
          .limit(20)
      )
    : { ok: false, data: null, error: "orgId missing" };

  // 4) grants con schema B: org_id (se esiste nel DB)
  const grantsByOrgId = orgId
    ? await tryQuery(async () =>
        admin
          .from("animal_access_grants")
          // se org_id non esiste, qui avrai error chiaro "column org_id does not exist"
          .select("id, animal_id, org_id, status, valid_to, revoked_at, created_at")
          // @ts-ignore
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(20)
      )
    : { ok: false, data: null, error: "orgId missing" };

  // 5) grants "attivi" come li filtriamo nella lista (schema A)
  const grantsActiveFiltered = orgId
    ? await tryQuery(async () =>
        admin
          .from("animal_access_grants")
          .select("id, animal_id, grantee_type, grantee_id, status, valid_to, revoked_at, created_at")
          .eq("grantee_type", "org")
          .eq("grantee_id", orgId)
          .eq("status", "active")
          .is("revoked_at", null)
          .or(`valid_to.is.null,valid_to.gt.${nowIso}`)
          .order("created_at", { ascending: false })
          .limit(50)
      )
    : { ok: false, data: null, error: "orgId missing" };

  // 6) opzionale: verifica rpc sul singolo animale
  const rpcCheck =
    orgId && animalId
      ? await tryQuery(async () =>
          supabase.rpc("is_grant_active", {
            p_animal: animalId,
            p_org: orgId,
          })
        )
      : { ok: false, data: null, error: animalId ? "orgId missing" : "animal_id not provided" };

  return NextResponse.json({
    nowIso,
    user: { id: user.id, email: user.email },
    orgId_from_getProfessionalOrgId: orgId ?? null,
    proProfile_lookup: proProfileRes,
    grants_by_grantee_schema: grantsByGrantee,
    grants_by_orgid_schema: grantsByOrgId,
    grants_active_filtered: grantsActiveFiltered,
    rpc_is_grant_active: rpcCheck,
    hint:
      "Se grants_active_filtered è vuoto ma grants_by_grantee_schema ha righe, allora status/valid_to/revoked_at non combaciano. Se grants_by_grantee_schema è vuoto ma grants_by_orgid_schema ha righe, allora i grant usano org_id e non grantee_id. Se entrambi vuoti, i grant non sono per la tua orgId o non esistono.",
  });
}