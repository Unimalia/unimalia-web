import "server-only";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

async function getAuthenticatedUserId() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return user.id;
}

async function resolveProfessionalRefs(userId: string) {
  const admin = supabaseAdmin();
  const refs = new Set<string>();

  refs.add(userId);

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResult.data?.org_id) {
    refs.add(profileResult.data.org_id);
  }

  const professionalResult = await admin
    .from("professionals")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  if (professionalResult.data?.id) {
    refs.add(professionalResult.data.id);
  }

  return Array.from(refs).filter(Boolean);
}

export async function hasActiveGrantForAnimal(animalId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return false;

  const admin = supabaseAdmin();
  const refs = await resolveProfessionalRefs(userId);

  const { data: grants } = await admin
    .from("animal_access_grants")
    .select(
      "grantee_type, grantee_id, status, valid_from, valid_to, revoked_at, scope_read, scope_write"
    )
    .eq("animal_id", animalId)
    .is("revoked_at", null)
    .in("status", ["active", "approved"]);

  const now = Date.now();

  return Boolean(
    (grants || []).find((g: any) => {
      const from = g.valid_from ? new Date(g.valid_from).getTime() : 0;
      const to = g.valid_to ? new Date(g.valid_to).getTime() : Infinity;

      if (now < from || now > to) return false;
      if (!g.scope_read && !g.scope_write) return false;

      if (g.grantee_type === "user" && g.grantee_id === userId) return true;
      if (g.grantee_type === "org" && refs.includes(String(g.grantee_id))) return true;

      return false;
    })
  );
}