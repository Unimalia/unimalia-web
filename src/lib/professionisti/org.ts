import "server-only";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase/server";

type ProfessionalProfileRow = {
  user_id: string;
  org_id: string | null;
};

export async function getProfessionalOrgId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const admin = supabaseAdmin();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) return null;

  const profileResult = await admin
    .from("professional_profiles")
    .select("user_id, org_id")
    .eq("user_id", user.id)
    .maybeSingle<ProfessionalProfileRow>();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const profileOrgId = profileResult.data?.org_id ?? null;

  if (!profileOrgId) {
    return null;
  }

  const organizationResult = await admin
    .from("organizations")
    .select("id")
    .eq("id", profileOrgId)
    .maybeSingle<{ id: string }>();

  if (organizationResult.error) {
    throw organizationResult.error;
  }

  if (!organizationResult.data?.id) {
    return null;
  }

  return organizationResult.data.id;
}